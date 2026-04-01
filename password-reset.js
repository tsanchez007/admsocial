// api/auth/password-reset.js
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;
  if (action === 'reset_direct') return handleResetDirect(req, res);
  return res.status(400).json({ error: 'Action inválida' });
}

async function handleResetDirect(req, res) {
  const { email, newPassword } = req.body;
  if (!email || !newPassword)
    return res.status(400).json({ error: 'Email y nueva contraseña son requeridos' });
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
    const hash = hashPassword(newPassword);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE email = ?', [hash, email]);
    await db.end();
    return res.json({ success: true });
  } catch (err) {
    console.error('[reset-direct]', err);
    try { await db.end(); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
}
