import mysql from 'mysql2/promise';
export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    const [rows] = await db.query('SELECT id, username, rol, activo FROM usuarios');
    await db.end();
    return res.json({ users: rows });
}
