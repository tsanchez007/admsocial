const axios = require('axios');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export default async function handler(req, res) {
    const { code, error } = req.query;
    if (error) return res.status(400).send(`Error de Meta: ${error}`);

    try {
        const redirectUri = `${process.env.FRONTEND_URL}/api/auth/callback`;
        const tokenRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/oauth/access_token`, {
            params: {
                client_id: process.env.META_APP_ID,
                client_secret: process.env.META_APP_SECRET,
                redirect_uri: redirectUri,
                code
            }
        });

        const userToken = tokenRes.data.access_token;
        const accountsRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/me/accounts`, {
            params: {
                access_token: userToken,
                fields: 'name,access_token,id,instagram_business_account{id,username}'
            }
        });

        const pages = accountsRes.data.data || [];
        for (const page of pages) {
            await pool.query(
                'INSERT INTO accounts (platform, username, access_token, page_id, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token=VALUES(access_token)',
                ['facebook', page.name, page.access_token, page.id, 'connected']
            );
            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                await pool.query(
                    'INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token=VALUES(access_token)',
                    ['instagram', ig.username, page.access_token, page.id, ig.id, 'connected']
                );
            }
        }
        res.redirect(`${process.env.FRONTEND_URL}/?connected=true`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.response?.data || err.message);
        res.status(500).send('Error procesando el login');
    }
}
