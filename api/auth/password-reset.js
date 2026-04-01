// api/auth/password-reset.js
// POST { action: 'forgot', email } → envía código
// POST { action: 'reset', email, code, newPassword } → cambia contraseña

import mysql from 'mysql2/promise';
import crypto from 'crypto';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password + 'admsocial_salt').digest('hex');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaq6CJ_MzxmoJJ7XygGV8PegelnNuTshZwZvmckGG5QLA1YF5obfLAiG7bHehgjGMt/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;
  if (action === 'forgot') return handleForgot(req, res);
  if (action === 'reset')  return handleReset(req, res);
  return res.status(400).json({ error: 'Action inválida. Usa "forgot" o "reset"' });
}

async function handleForgot(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const db = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
    );

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

    // Enviar email via Google Apps Script
    const emailRes = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        code,
        nombre: user.nombre || user.username
      })
    });

    const emailData = await emailRes.json();
    if (!emailData.success) throw new Error('Error enviando email: ' + emailData.error);

    return res.json({ success: true, message: 'Código enviado al correo.' });

  } catch (err) {
    console.error('[forgot]', err);
    try { await db.end(); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
}

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
