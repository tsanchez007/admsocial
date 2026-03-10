import mysql from 'mysql2/promise';

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

        // 1. Obtener access token
        const tokenRes = await fetch(`https://graph.facebook.com/${process.env.META_API_VERSION}/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
        const tokenData = await tokenRes.json();
        if (tokenData.error) return res.status(400).json({ error: tokenData.error });

        const accessToken = tokenData.access_token;

        // 2. Obtener páginas de Facebook
        const pagesRes = await fetch(`https://graph.facebook.com/${process.env.META_API_VERSION}/me/accounts?access_token=${accessToken}`);
        const pagesData = await pagesRes.json();

        if (pagesData.data && pagesData.data.length > 0) {
            for (const page of pagesData.data) {
                // 3. Buscar cuenta de Instagram conectada a la página
                const igRes = await fetch(`https://graph.facebook.com/${process.env.META_API_VERSION}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
                const igData = await igRes.json();
                const igAccountId = igData.instagram_business_account?.id || null;

                // 4. Guardar en base de datos
                await pool.query(
                    `INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id, status)
                     VALUES (?, ?, ?, ?, ?, 'connected')
                     ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), status = 'connected'`,
                    ['facebook', page.name, page.access_token, page.id, igAccountId]
                );
            }
        }

        res.redirect(`${process.env.FRONTEND_URL}/?connected=true`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.message);
        res.status(500).send('Error procesando el login: ' + err.message);
    }
}
