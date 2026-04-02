import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    if (req.headers.authorization !== 'Bearer admsocial-cron-2024-secreto') return res.status(401).end();

    const accounts = req.body.accounts;
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const results = [];
    for (const a of accounts) {
        await db.execute(
            `INSERT INTO cuentas (plataforma, usuario, token, page_id, ig_account_id, nombre)
             VALUES ('instagram', ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE token = VALUES(token), ig_account_id = VALUES(ig_account_id), nombre = VALUES(nombre)`,
            [a.nombre, a.token, a.page_id, a.ig_id, a.nombre]
        );
        results.push(a.nombre);
    }
    await db.end();
    res.json({ success: true, inserted: results });
}
