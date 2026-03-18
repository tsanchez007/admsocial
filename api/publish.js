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

function isVideoUrl(url) { return url && (url.includes('/video/') || /\.(mp4|mov|webm|avi)/i.test(url)); }
function isBase64Image(str) { return str && str.startsWith('data:image'); }

async function publishToFacebook(post, cuenta) {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const token = cuenta.token;
    const pageId = cuenta.page_id || cuenta.usuario;

    console.log('publishToFacebook imagen_url:', (post.imagen_url||'').slice(0,80));
    // Parsear imagen_url — puede ser JSON array (carrusel) o URL/base64 única
    let mediaUrls = [];
    try {
        const parsed = JSON.parse(post.imagen_url || '[]');
        if (Array.isArray(parsed)) mediaUrls = parsed;
        else if (post.imagen_url) mediaUrls = [post.imagen_url];
    } catch(e) {
        if (post.imagen_url) mediaUrls = [post.imagen_url];
    }

    // Resolver URLs públicas
    const publicUrls = [];
    for (const m of mediaUrls) {
        if (!m) continue;
        if (isBase64Image(m)) {
            const url = await uploadBase64ToImgbb(m);
            if (url) publicUrls.push(url);
        } else {
            publicUrls.push(m);
        }
    }

    if (publicUrls.length > 1) {
        // CARRUSEL
        const attachments = [];
        for (const url of publicUrls) {
            if (isVideoUrl(url)) {
                const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/videos`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_url: url, published: false, access_token: token })
                });
                const d = await r.json();
                if (d.error) throw new Error(d.error.message);
                attachments.push({ media_fbid: d.id });
            } else {
                const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/photos`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, published: false, access_token: token })
                });
                const d = await r.json();
                if (d.error) throw new Error(d.error.message);
                attachments.push({ media_fbid: d.id });
            }
        }
        const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: post.contenido || '', attached_media: attachments, access_token: token })
        });
        const d = await r.json();
        if (d.error) throw new Error(d.error.message);
        return;
    }

    if (publicUrls.length === 1) {
        const media = publicUrls[0];
        if (isVideoUrl(media)) {
            const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/videos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_url: media, description: post.contenido || '', access_token: token })
            });
            const d = await r.json();
            if (d.error) throw new Error(d.error.message);
            return;
        }
        const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/photos`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: media, message: post.contenido || '', access_token: token })
        });
        const d = await r.json();
        if (d.error) throw new Error(d.error.message);
        return;
    }

    // Solo texto
    const r = await fetch(`https://graph.facebook.com/${apiVersion}/${pageId}/feed`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

    // Fix: imagen_url puede ser un array JSON string
    let media = post.imagen_url;
    if (media && media.startsWith('[')) {
        try { media = JSON.parse(media)[0]; } catch(e) {}
    }

    if (isVideoUrl(media)) {
        const mediaRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_url: media, media_type: 'REELS', caption: post.contenido || '', access_token: token })
        });
        const mediaData = await mediaRes.json();
        if (!mediaData.id) throw new Error('No se pudo crear contenedor de video en Instagram');
        let status = 'IN_PROGRESS';
        for (let i = 0; i < 12; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const statusRes = await fetch(`https://graph.facebook.com/${apiVersion}/${mediaData.id}?fields=status_code&access_token=${token}`);
            const statusData = await statusRes.json();
            status = statusData.status_code;
            if (status === 'FINISHED') break;
            if (status === 'ERROR') throw new Error('Error procesando video en Instagram');
        }
        const pubRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: mediaData.id, access_token: token })
        });
        const pubData = await pubRes.json();
        if (pubData.error) throw new Error(pubData.error.message);
        return;
    }

    let mediaUrl = media;
    if (isBase64Image(media)) {
        mediaUrl = await uploadBase64ToImgbb(media);
    }
    if (!mediaUrl) return;

    const mediaRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: mediaUrl, caption: post.contenido || '', access_token: token })
    });
    const mediaData = await mediaRes.json();
    if (!mediaData.id) throw new Error('No se pudo crear contenedor de imagen en Instagram');
    await new Promise(r => setTimeout(r, 5000));
    const pubRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: mediaData.id, access_token: token })
    });
    const pubData = await pubRes.json();
    if (pubData.error) throw new Error(pubData.error.message);
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
                // Marcar como procesando ANTES de publicar para evitar duplicados
                await db.query("UPDATE publicaciones SET estado = 'procesando' WHERE id = ?", [post.id]);
                const plataformas = (post.plataformas || '').split(',').filter(Boolean);
                for (const plat of plataformas) {
                    const cuenta = cuentas.find(c => c.plataforma === plat && (!post.cuenta_nombre || post.cuenta_nombre.includes(c.usuario) || post.cuenta_nombre.includes(c.nombre || '')));
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
