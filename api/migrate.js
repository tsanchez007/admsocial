import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    try {
        await db.query("ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS page_id VARCHAR(100) DEFAULT NULL");
        await db.query("ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS ig_account_id VARCHAR(100) DEFAULT NULL");
        await db.query("ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS nombre VARCHAR(200) DEFAULT NULL");
        await db.end();
        return res.json({ success: true, message: "Migracion completada" });
    } catch (err) {
        await db.end();
        return res.status(500).json({ success: false, error: err.message });
    }
}
