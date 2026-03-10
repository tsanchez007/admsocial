const express = require('express');
const axios   = require('axios');
const db      = require('../database');
const router  = express.Router();

router.get('/login', (req, res) => {
    const scope = [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'public_profile'
    ].join(',');
    
    const url = `https://www.facebook.com/${process.env.META_API_VERSION}/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent('http://localhost:3000/api/auth/callback')}&scope=${scope}&response_type=code`;
    console.log('[AUTH] Redirigiendo a Meta...');
    res.redirect(url);
});

router.get('/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error) return res.status(400).send(`Error de Meta: ${error}`);

    try {
        const tokenRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/oauth/access_token`, {
            params: {
                client_id: process.env.META_APP_ID,
                client_secret: process.env.META_APP_SECRET,
                redirect_uri: 'http://localhost:3000/api/auth/callback',
                code
            }
        });

        const userToken = tokenRes.data.access_token;
        console.log('[AUTH] Token obtenido. Buscando páginas...');

        const accountsRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/me/accounts`, {
            params: { 
                access_token: userToken,
                fields: 'name,access_token,id,instagram_business_account{id,username,name,profile_picture_url}' 
            }
        });

        const pages = accountsRes.data.data || [];
        console.log(`[AUTH] Se encontraron ${pages.length} páginas.`);

        for (const page of pages) {
            // Guardar Página de Facebook
            db.prepare('INSERT OR REPLACE INTO accounts (platform, username, access_token, page_id, status) VALUES (?, ?, ?, ?, ?)')
              .run('facebook', page.name, page.access_token, page.id, 'active');

            // Guardar Instagram si está vinculado
            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                db.prepare('INSERT OR REPLACE INTO accounts (platform, username, access_token, page_id, ig_account_id, status) VALUES (?, ?, ?, ?, ?, ?)')
                  .run('instagram', ig.username, page.access_token, page.id, ig.id, 'active');
                console.log(`[AUTH] Instagram detectado: @${ig.username}`);
            }
        }

        res.redirect('http://localhost:3000/?connected=true');
    } catch (err) {
        console.error('[AUTH ERROR]', err.response?.data || err.message);
        res.status(500).send('Error procesando el login');
    }
});

module.exports = router;