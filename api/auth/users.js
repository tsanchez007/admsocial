// api/auth/users.js
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const hashPassword = (password) => crypto.createHash('sha256').update(password + 'admsocial_salt').digest('hex');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const db = await mysql.createConnection(dbConfig);
    try {
        // LOGIN — detectado por _action o por url
        if (req.method === 'POST' && (req.body?._action === 'login' || req.url?.includes('login'))) {
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
            const { username, password, nombre, rol, email, permisos } = req.body;
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
