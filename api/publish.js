import mysql from 'mysql2/promise';

async function uploadBase64ToImgbb(base64) {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) return null;
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
            await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: imageUrl, message: post.contenido || '', access_token: token })
            });
            return;
        }
    }
    await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: post.contenido || '', access_token: token })
    });
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
    if (!mediaData.id) return;
    await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: mediaData.id, access_token: token })
    });
}

export default async function handler(req, res) {
    const auth = req.headers['authorization'];
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
    try {
        const now = new Date().toISOString().slice(0, 16);
        const [posts] = await db.query(
            "SELECT * FROM publicaciones WHERE estado = 'pendiente' AND substr(fecha_programada, 1, 16) <= ?",
            [now]
        );
        if (posts.length === 0) {
            await db.end();
            return res.json({ success: true, message: 'No hay posts para publicar' });
        }
        const [cuentas] = await db.query('SELECT * FROM cuentas');
        const results = [];
        for (const post of posts) {
            try {
                const plataformas = (post.plataformas || '').split(',').filter(Boolean);
                for (const plat of plataformas) {
                    const cuenta = cuentas.find(c => c.plataforma === plat);
                    if (!cuenta) continue;
                    if (plat === 'facebook') await publishToFacebook(post, cuenta);
                    if (plat === 'instagram') await publishToInstagram(post, cuenta);
                }
                await db.query("UPDATE publicaciones SET estado = 'publicado' WHERE id = ?", [post.id]);
                results.push({ id: post.id, status: 'publicado' });
            } catch (err) {
                await db.query("UPDATE publicaciones SET estado = 'fallido' WHERE id = ?", [post.id]);
                results.push({ id: post.id, status: 'fallido', error: err.message });
            }
        }
        await db.end();
        return res.json({ success: true, results });
    } catch (err) {
        await db.end();
        return res.status(500).json({ success: false, error: err.message });
    }
}
