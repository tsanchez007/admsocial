const express = require('express');
const axios   = require('axios');
const db      = require('../database');
const router  = express.Router();

const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

router.get('/login', (req, res) => {
    const scope = [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'public_profile'
    ].join(',');

    const url = `https://www.facebook.com/${process.env.META_API_VERSION}/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;
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
                redirect_uri: REDIRECT_URI,
                code
            }
        });

        const userToken = tokenRes.data.access_token;

        const accountsRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/me/accounts`, {
            params: {
                access_token: userToken,
                fields: 'name,access_token,id,instagram_business_account{id,username,name,profile_picture_url}'
            }
        });

        const pages = accountsRes.data.data || [];

        for (const page of pages) {
            await db.query(
                'INSERT INTO accounts (platform, username, access_token, page_id, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token=VALUES(access_token)',
                ['facebook', page.name, page.access_token, page.id, 'connected']
            );

            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                await db.query(
                    'INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token=VALUES(access_token)',
                    ['instagram', ig.username, page.access_token, page.id, ig.id, 'connected']
                );
            }
        }

        res.redirect(`${FRONTEND_URL}/?connected=true`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.response?.data || err.message);
        res.status(500).send('Error procesando el login');
    }
});

module.exports = router;
