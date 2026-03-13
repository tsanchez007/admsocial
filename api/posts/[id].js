import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const [rows] = await db.query('SELECT * FROM publicaciones WHERE id = ?', [id]);
            return res.json(rows[0] || {});
        }

        if (req.method === 'PATCH') {
            const { contenido, fecha_programada, image_base64 } = req.body;
            const fields = ['contenido = ?', 'fecha_programada = ?'];
            const values = [contenido, fecha_programada];
            if (image_base64) { fields.push('imagen_url = ?'); values.push(image_base64); }
            values.push(id);
            await db.query(`UPDATE publicaciones SET ${fields.join(', ')} WHERE id = ?`, values);
            const [rows] = await db.query('SELECT * FROM publicaciones WHERE id = ?', [id]);
            return res.json({ success: true, post: rows[0] });
        }

        if (req.method === 'DELETE') {
            await db.query('DELETE FROM publicaciones WHERE id = ?', [id]);
            return res.json({ success: true });
        }

        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        await db.end();
    }
}
