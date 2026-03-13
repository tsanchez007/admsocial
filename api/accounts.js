import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        const [rows] = await db.execute('SELECT * FROM cuentas');
        await db.end();

        return res.json({ success: true, accounts: rows });
    } catch (err) {
        console.error('Accounts error:', err);
        return res.status(500).json({ success: false, error: err.message });
    }
}
