// api/auth/forgot-password.js
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const db = await mysql.createConnection(dbConfig);

  try {
    // Buscar usuario por email
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );

    // Siempre responder igual por seguridad
    if (!rows.length) {
      await db.end();
      return res.json({ success: true, message: 'Si el email existe, recibirás un código.' });
    }

    const user = rows[0];

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar código en DB (crear tabla si no existe)
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

    // Borrar códigos anteriores del usuario
    await db.query('DELETE FROM reset_codes WHERE user_id = ?', [user.id]);

    // Insertar nuevo código
    await db.query(
      'INSERT INTO reset_codes (user_id, code, expires_at) VALUES (?, ?, ?)',
      [user.id, code, expiresAt]
    );

    await db.end();

    // Enviar email con nodemailer
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
    console.error('[forgot-password]', err);
    try { await db.end(); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
}
