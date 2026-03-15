import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        if (req.method === 'DELETE') {
            const id = req.query.id;
            if (!id) { await db.end(); return res.status(400).json({ error: 'id requerido' }); }
            await db.execute('DELETE FROM cuentas WHERE id = ?', [id]);
            await db.end();
            return res.json({ success: true });
        }

        // GET - listar cuentas
        const [rows] = await db.execute('SELECT * FROM cuentas');
        await db.end();
        return res.json({ success: true, accounts: rows });
    } catch (err) {
        console.error('Accounts error:', err);
        await db.end();
        return res.status(500).json({ success: false, error: err.message });
    }
}
