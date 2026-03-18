import mysql from 'mysql2/promise';

async function uploadBase64ToImgbb(base64) {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey || !base64) return null;
    const data = base64.replace(/^data:image\/\w+;base64,/, '');
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(data)}`
    });
    const json = await res.json();
    return json?.data?.url || null;
}

async function publishToFacebook(post, cuenta) {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const token = cuenta.token;
    const pageId = cuenta.page_id || cuenta.usuario;
    if (post.imagen_url) {
        const imageUrl = await uploadBase64ToImgbb(post.imagen_url);
        if (imageUrl) {
            const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: imageUrl, message: post.contenido || '', access_token: token })
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error.message);
            return;
        }
    }
    const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: post.contenido || '', access_token: token })
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
}

async function publishToInstagram(post, cuenta) {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const token = cuenta.token;
    const igId = cuenta.ig_account_id;
    if (!igId || !post.imagen_url) return;
    const imageUrl = await uploadBase64ToImgbb(post.imagen_url);
    if (!imageUrl) return;
    const mediaRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption: post.contenido || '', access_token: token })
    });
    const mediaData = await mediaRes.json();
    if (!mediaData.id) throw new Error('No se pudo crear el contenedor de media');
    const pubRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: mediaData.id, access_token: token })
    });
    const pubData = await pubRes.json();
    if (pubData.error) throw new Error(pubData.error.message);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ error: 'post_id requerido' });
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    try {
        const [rows] = await db.query('SELECT * FROM publicaciones WHERE id = ?', [post_id]);
        if (!rows.length) { await db.end(); return res.status(404).json({ error: 'Post no encontrado' }); }
        const post = rows[0];
        const [cuentas] = await db.query('SELECT * FROM cuentas');
        const plataformas = (post.plataformas || '').split(',').filter(Boolean);
        for (const plat of plataformas) {
            const cuenta = cuentas.find(c => c.plataforma === plat);
            if (!cuenta) continue;
            if (plat === 'facebook') await publishToFacebook(post, cuenta);
            if (plat === 'instagram') await publishToInstagram(post, cuenta);
        }
        await db.query("UPDATE publicaciones SET estado = 'publicado' WHERE id = ?", [post_id]);
        await db.end();
        return res.json({ success: true });
    } catch (err) {
        try { await db.query("UPDATE publicaciones SET estado = 'fallido' WHERE id = ?", [post_id]); await db.end(); } catch(e) {}
        return res.status(500).json({ success: false, error: err.message });
    }
}
