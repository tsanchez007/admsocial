const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const [posts] = await pool.query('SELECT * FROM posts ORDER BY scheduled_at ASC');
        return res.json({ success: true, posts });
    }
    if (req.method === 'POST') {
        const { text, scheduled_at, instagram, facebook } = req.body;
        if (!scheduled_at) return res.status(400).json({ success: false, error: 'La fecha es requerida' });
        if (new Date(scheduled_at) <= new Date()) return res.status(400).json({ success: false, error: 'La fecha debe ser futura' });

        const [result] = await pool.query(
            'INSERT INTO posts (text, image_url, scheduled_at, instagram, facebook) VALUES (?, ?, ?, ?, ?)',
            [text || '', null, scheduled_at, instagram ? 1 : 0, facebook ? 1 : 0]
        );
        const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
        return res.json({ success: true, post: rows[0] });
    }
    if (req.method === 'DELETE') {
        const id = req.url.split('/').pop();
        await pool.query('DELETE FROM posts WHERE id = ?', [id]);
        return res.json({ success: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
}
