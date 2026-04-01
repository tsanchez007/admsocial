// api/auth/reset-password.js
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword)
    return res.status(400).json({ error: 'Email, código y nueva contraseña son requeridos' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

  const db = await mysql.createConnection(dbConfig);

  try {
    // Buscar usuario
    const [users] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1',
      [email]
    );
    if (!users.length) {
      await db.end();
      return res.status(400).json({ error: 'Email no encontrado' });
    }
    const user = users[0];

    // Verificar código
    const [codes] = await db.query(
      'SELECT * FROM reset_codes WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > NOW()',
      [user.id, code]
    );
    if (!codes.length) {
      await db.end();
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Actualizar contraseña
    const hash = hashPassword(newPassword);
    await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, user.id]);

    // Marcar código como usado
    await db.query('UPDATE reset_codes SET used = 1 WHERE user_id = ?', [user.id]);

    await db.end();
    return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });

  } catch (err) {
    console.error('[reset-password]', err);
    try { await db.end(); } catch(e) {}
    return res.status(500).json({ error: err.message });
  }
}
