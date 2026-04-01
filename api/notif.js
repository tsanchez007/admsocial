import mysql from 'mysql2/promise';
export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    try {
        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT * FROM notificaciones ORDER BY fecha DESC LIMIT 50');
            await db.end();
            return res.json({ success: true, notificaciones: rows });
        }
        if (req.method === 'POST') {
            const { mensaje, tipo } = req.body;
            await db.query('INSERT INTO notificaciones (tipo, mensaje) VALUES (?,?)', [tipo||'info', mensaje]);
            await db.end();
            return res.json({ success: true });
        }
        if (req.method === 'PUT') {
            await db.query('UPDATE notificaciones SET leido=1 WHERE leido=0');
            await db.end();
            return res.json({ success: true });
        }
        await db.end();
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        await db.end();
        return res.status(500).json({ error: err.message });
    }
}
