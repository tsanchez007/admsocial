import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const [accounts] = await pool.query('SELECT * FROM accounts WHERE status = "connected"');
        return res.json({ success: true, accounts });
    }
    if (req.method === 'POST') {
        const { platform, username, access_token, page_id, ig_account_id } = req.body;
        await pool.query(
            'INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id) VALUES (?, ?, ?, ?, ?)',
            [platform, username, access_token, page_id || null, ig_account_id || null]
        );
        return res.json({ success: true });
    }
    if (req.method === 'DELETE') {
        const id = req.url.split('/').pop();
        await pool.query('UPDATE accounts SET status = ? WHERE id = ?', ['disconnected', id]);
        return res.json({ success: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
}
