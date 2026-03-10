const db   = require('./database');
const axios = require('axios');

async function publishScheduledPosts() {
    const now = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

    // Buscar posts programados cuya hora ya llegó
    const posts = db.prepare(`
        SELECT * FROM posts
        WHERE status = 'scheduled'
        AND substr(scheduled_at, 1, 16) <= ?
    `).all(now);

    if (posts.length === 0) return;

    console.log(`[SCHEDULER] ${posts.length} post(s) para publicar ahora`);

    for (const post of posts) {
        try {
            await publishPost(post);
            db.prepare(`UPDATE posts SET status = 'published' WHERE id = ?`).run(post.id);
            console.log(`[SCHEDULER] ✅ Post #${post.id} publicado`);
        } catch (err) {
            db.prepare(`UPDATE posts SET status = 'failed' WHERE id = ?`).run(post.id);
            console.error(`[SCHEDULER] ❌ Error en post #${post.id}:`, err.message);
        }
    }
}

async function publishPost(post) {
    const accounts = db.prepare(`SELECT * FROM accounts WHERE status = 'connected'`).all();

    for (const account of accounts) {
        if (post.instagram && account.platform === 'instagram') {
            await publishToInstagram(post, account);
        }
        if (post.facebook && account.platform === 'facebook') {
            await publishToFacebook(post, account);
        }
    }
}

async function publishToInstagram(post, account) {
    const { ig_account_id, access_token } = account;
    const imageUrl = post.image_url;

    if (!imageUrl) {
        // Solo texto (no soportado en IG sin imagen)
        console.warn('[IG] Instagram requiere imagen. Post de solo texto omitido.');
        return;
    }

    // Paso 1: Crear contenedor de media
    const mediaRes = await axios.post(
        `https://graph.facebook.com/v19.0/${ig_account_id}/media`,
        {
            image_url:   imageUrl,
            caption:     post.text || '',
            access_token
        }
    );

    const creationId = mediaRes.data.id;

    // Paso 2: Publicar el contenedor
    await axios.post(
        `https://graph.facebook.com/v19.0/${ig_account_id}/media_publish`,
        { creation_id: creationId, access_token }
    );
}

async function publishToFacebook(post, account) {
    const { page_id, access_token } = account;

    if (post.image_url) {
        await axios.post(
            `https://graph.facebook.com/v19.0/${page_id}/photos`,
            {
                url:          post.image_url,
                message:      post.text || '',
                access_token
            }
        );
    } else {
        await axios.post(
            `https://graph.facebook.com/v19.0/${page_id}/feed`,
            {
                message:      post.text || '',
                access_token
            }
        );
    }
}

module.exports = { publishScheduledPosts };
