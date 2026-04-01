// api/auth/users.js
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const hashPassword = (password) => crypto.createHash('sha256').update(password + 'admsocial_salt').digest('hex');

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaq6CJ_MzxmoJJ7XygGV8PegelnNuTshZwZvmckGG5QLA1YF5obfLAiG7bHehgjGMt/exec';

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const url = req.url || '';

    // ── Forgot Password ─────────────────────────────────────────────
    if (req.method === 'POST' && url.includes('forgot')) {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requerido' });

        const db = await mysql.createConnection(dbConfig);
        try {
            const [users] = await db.query(
                'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
            );

            if (!users.length) {
                await db.end();
                return res.json({ success: true });
            }

            const user = users[0];
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

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

            // Enviar email via Apps Script
            await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_only',
                    email,
                    code,
                    nombre: user.nombre || user.username
                })
            });

            return res.json({ success: true });

        } catch (err) {
            console.error('[forgot]', err);
            try { await db.end(); } catch(e) {}
            return res.status(500).json({ error: err.message });
        }
    }

    // ── Reset Password ──────────────────────────────────────────────
    if (req.method === 'POST' && url.includes('reset')) {
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

            return res.json({ success: true });

        } catch (err) {
            console.error('[reset]', err);
            try { await db.end(); } catch(e) {}
            return res.status(500).json({ error: err.message });
        }
    }

    // ── Login ───────────────────────────────────────────────────────
    const db = await mysql.createConnection(dbConfig);
    try {
        if (req.method === 'POST' && url.includes('login')) {
            const { username, password } = req.body;
            const hash = hashPassword(password);
            const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ? AND password_hash = ? AND activo = 1', [username, hash]);
            if (!rows.length) { await db.end(); return res.status(401).json({ error: 'Usuario o contraseña incorrectos' }); }
            const user = rows[0];
            await db.end();
            return res.json({ success: true, user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol } });
        }

        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT id, username, nombre, rol, activo, fecha_creacion, email FROM usuarios');
            await db.end();
            return res.json({ success: true, users: rows });
        }

        if (req.method === 'POST') {
            const { username, password, nombre, rol, email, permisos, cuentas } = req.body;
            const hash = hashPassword(password);
            const [existing] = await db.query('SELECT id FROM usuarios WHERE username = ?', [username]);
            if (existing.length) { await db.end(); return res.status(400).json({ error: 'El usuario ya existe' }); }
            await db.query(
                'INSERT INTO usuarios (username, password_hash, nombre, rol, email, permisos) VALUES (?, ?, ?, ?, ?, ?)',
                [username, hash, nombre, rol || 'asistente', email || null, permisos || null]
            );
            await db.end();
            return res.json({ success: true });
        }

        if (req.method === 'PUT') {
            const { id, password, nombre, rol, activo, email } = req.body;
            if (password) {
                const hash = hashPassword(password);
                await db.query('UPDATE usuarios SET password_hash = ?, nombre = ?, rol = ?, activo = ?, email = ? WHERE id = ?', [hash, nombre, rol, activo, email, id]);
            } else {
                await db.query('UPDATE usuarios SET nombre = ?, rol = ?, activo = ?, email = ? WHERE id = ?', [nombre, rol, activo, email, id]);
            }
            await db.end();
            return res.json({ success: true });
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
            await db.end();
            return res.json({ success: true });
        }

        await db.end();
        return res.status(405).json({ error: 'Method not allowed' });

    } catch (err) {
        try { await db.end(); } catch(e) {}
        return res.status(500).json({ error: err.message });
    }
}
