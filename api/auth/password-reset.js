// api/auth/password-reset.js
// Maneja tanto el envío del código como el reset de contraseña
// POST con { action: 'forgot', email } → envía código
// POST con { action: 'reset', email, code, newPassword } → cambia contraseña

import mysql from 'mysql2/promise';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password + 'admsocial_salt').digest('hex');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  if (action === 'forgot') {
    return handleForgot(req, res);
  } else if (action === 'reset') {
    return handleReset(req, res);
  } else {
    return res.status(400).json({ error: 'Action inválida. Usa "forgot" o "reset"' });
  }
}

// ── Enviar código por email ─────────────────────────────────────────
async function handleForgot(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const db = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
    );

    // Siempre responder igual por seguridad
    if (!rows.length) {
      await db.end();
      return res.json({ success: true, message: 'Si el email existe, recibirás un código.' });
    }

    const user = rows[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Crear tabla si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS reset_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL,
        used TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query('DELETE FROM reset_codes WHERE user_id = ?', [user.id]);
    await db.query(
      'INSERT INTO reset_codes (user_id, code, expires_at) VALUES (?, ?, ?)',
      [user.id, code, expiresAt]
    );
    await db.end();

    // Enviar email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"AdmSocial" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Código de recuperación — AdmSocial',
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;background:#f4f5fb;padding:32px;border-radius:16px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:2rem;font-weight:800;color:#6c63ff;">◈ AdmSocial</div>
            <p style="color:#888;margin-top:4px;font-size:0.9rem;">Gestor de Redes Sociales</p>
          </div>
          <div style="background:white;border-radius:12px;padding:28px;text-align:center;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <p style="font-size:1rem;color:#333;margin-bottom:8px;">Hola <strong>${user.nombre || user.username}</strong>,</p>
            <p style="font-size:0.9rem;color:#666;margin-bottom:24px;">Recibimos una solicitud para restablecer tu contraseña. Usa este código:</p>
            <div style="background:#f4f5fb;border:2px dashed #6c63ff;border-radius:12px;padding:20px;margin:0 auto;width:fit-content;">
              <span style="font-size:2.5rem;font-weight:900;letter-spacing:10px;color:#6c63ff;">${code}</span>
            </div>
            <p style="font-size:0.8rem;color:#999;margin-top:16px;">⏱ Este código expira en <strong>15 minutos</strong></p>
            <p style="font-size:0.8rem;color:#999;margin-top:8px;">Si no solicitaste esto, ignora este correo.</p>
          </div>
          <p style="text-align:center;font-size:0.75rem;color:#bbb;margin-top:20px;">© 2026 AdmSocial · admsocial.vercel.app</p>
        </div>
      `,
    });

    return res.json({ success: true, message: 'Código enviado al correo.' });

  } catch (err) {
    console.error('[forgot]', err);
    try { await db.end(); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
}

// ── Verificar código y cambiar contraseña ───────────────────────────
async function handleReset(req, res) {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ error: 'Email, código y nueva contraseña son requeridos' });
  if (newPassword.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const db = await mysql.createConnection(dbConfig);
  try {
    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
    );
    if (!users.length) {
      await db.end();
      return res.status(400).json({ error: 'Email no encontrado' });
    }
    const user = users[0];

    const [codes] = await db.query(
      'SELECT * FROM reset_codes WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > NOW()',
      [user.id, code]
    );
    if (!codes.length) {
      await db.end();
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const hash = hashPassword(newPassword);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, user.id]);
    await db.query('UPDATE reset_codes SET used = 1 WHERE user_id = ?', [user.id]);
    await db.end();

    return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });

  } catch (err) {
    console.error('[reset]', err);
    try { await db.end(); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
}
