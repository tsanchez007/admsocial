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
            const id = req.url.split('/').filter(Boolean).pop();
            if (id && !isNaN(id)) {
                const [rows] = await db.query('SELECT * FROM publicaciones WHERE id = ?', [id]);
                return res.json(rows[0] || {});
            }
            const [posts] = await db.query('SELECT *, cuenta_nombre FROM publicaciones ORDER BY fecha_programada ASC');
            return res.json({ success: true, posts });
        }

        if (req.method === 'POST') {
            const { text, scheduled_at, instagram, facebook, image_base64, cuenta_nombre, tipo_publicacion } = req.body;
            if (!scheduled_at) return res.status(400).json({ success: false, error: 'La fecha es requerida' });
            const plataformas = [instagram ? 'instagram' : '', facebook ? 'facebook' : ''].filter(Boolean).join(',');
            const [result] = await db.query(
                'INSERT INTO publicaciones (titulo, contenido, imagen_url, plataformas, fecha_programada, estado, cuenta_nombre, tipo_publicacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                ['', text || '', image_base64 || null, plataformas, scheduled_at, 'pendiente', cuenta_nombre || '', tipo_publicacion || null]
            );
            const [rows] = await db.query('SELECT * FROM publicaciones WHERE id = ?', [result.insertId]);
            return res.json({ success: true, post: rows[0] });
        }

        if (req.method === 'PATCH') {
            const id = req.url.split('/').pop();
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
            const id = req.url.split('/').pop();
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
