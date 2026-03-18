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

function isVideoUrl(url) {
    if (!url) return false;
    return url.includes('res.cloudinary.com') && (
        url.includes('/video/') || url.match(/\.(mp4|mov|avi|webm)/i)
    );
}

function isBase64Image(str) {
    if (!str) return false;
    return str.startsWith('data:image');
}

async function publishToFacebook(post, cuenta) {
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const token = cuenta.token;
    const pageId = cuenta.page_id || cuenta.usuario;

    // Parsear imagen_url — puede ser JSON array (carrusel) o URL/base64 única
    let mediaUrls = [];
    try {
        const parsed = JSON.parse(post.imagen_url || '[]');
        if (Array.isArray(parsed)) mediaUrls = parsed;
        else if (post.imagen_url) mediaUrls = [post.imagen_url];
    } catch(e) {
        if (post.imagen_url) mediaUrls = [post.imagen_url];
    }

    // Resolver URLs públicas (subir base64 a imgbb si es necesario)
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

    let mediaList = [];
    try {
        const parsed = JSON.parse(post.imagen_url);
        mediaList = Array.isArray(parsed) ? parsed : [parsed];
    } catch(e) {
        mediaList = [post.imagen_url];
    }
    mediaList = mediaList.filter(Boolean);
    if (!mediaList.length) return;

    if (mediaList.length === 1) {
        const mediaUrl = mediaList[0];
        if (isVideoUrl(mediaUrl)) {
            const mediaRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ video_url: mediaUrl, media_type: 'REELS', caption: post.contenido || '', access_token: token })
            });
            const mediaData = await mediaRes.json();
            if (!mediaData.id) throw new Error('Error video: ' + JSON.stringify(mediaData));
            let status = 'IN_PROGRESS';
            for (let i = 0; i < 12; i++) {
                await new Promise(r => setTimeout(r, 5000));
                const sr = await fetch(`https://graph.facebook.com/${apiVersion}/${mediaData.id}?fields=status_code&access_token=${token}`);
                const sd = await sr.json();
                status = sd.status_code;
                if (status === 'FINISHED') break;
                if (status === 'ERROR') throw new Error('Error procesando video IG');
            }
            const pubRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creation_id: mediaData.id, access_token: token })
            });
            const pubData = await pubRes.json();
            if (pubData.error) throw new Error(pubData.error.message);
            return;
        }
        let imgUrl = mediaUrl;
        if (isBase64Image(mediaUrl)) imgUrl = await uploadBase64ToImgbb(mediaUrl);
        if (!imgUrl) return;
        const mediaRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: imgUrl, caption: post.contenido || '', access_token: token })
        });
        const mediaData = await mediaRes.json();
        if (!mediaData.id) throw new Error('Error imagen: ' + JSON.stringify(mediaData));
        await new Promise(r => setTimeout(r, 5000));
        const pubRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: mediaData.id, access_token: token })
        });
        const pubData = await pubRes.json();
        if (pubData.error) throw new Error(pubData.error.message);
        return;
    }

    // CARRUSEL
    const childIds = [];
    for (const mediaUrl of mediaList) {
        let url = mediaUrl;
        if (isBase64Image(url)) url = await uploadBase64ToImgbb(url);
        if (!url) continue;
        const isVid = isVideoUrl(url);
        const body = isVid
            ? { video_url: url, media_type: 'VIDEO', is_carousel_item: true, access_token: token }
            : { image_url: url, is_carousel_item: true, access_token: token };
        const res = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!data.id) throw new Error('Error item carrusel: ' + JSON.stringify(data));
        if (isVid) {
            for (let i = 0; i < 12; i++) {
                await new Promise(r => setTimeout(r, 5000));
                const sr = await fetch(`https://graph.facebook.com/${apiVersion}/${data.id}?fields=status_code&access_token=${token}`);
                const sd = await sr.json();
                if (sd.status_code === 'FINISHED') break;
            }
        } else {
            await new Promise(r => setTimeout(r, 2000));
        }
        childIds.push(data.id);
    }

    const carouselRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_type: 'CAROUSEL', caption: post.contenido || '', children: childIds.join(','), access_token: token })
    });
    const carouselData = await carouselRes.json();
    if (!carouselData.id) throw new Error('Error carrusel: ' + JSON.stringify(carouselData));
    await new Promise(r => setTimeout(r, 3000));
    const pubRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}/media_publish`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: carouselData.id, access_token: token })
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
            const cuenta = cuentas.find(c => c.plataforma === plat && (!post.cuenta_nombre || post.cuenta_nombre.includes(c.usuario) || post.cuenta_nombre.includes(c.nombre || '')));
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
