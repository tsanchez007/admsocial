import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const { code, error } = req.query;
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const frontendUrl = process.env.FRONTEND_URL;
    const redirectUri = encodeURIComponent(`${frontendUrl}/api/auth/callback`);

    if (error) {
        return res.redirect(`${frontendUrl}?error=${error}`);
    }

    try {
        // 1. Obtener access token
        const tokenRes = await fetch(`https://graph.facebook.com/${apiVersion}/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return res.redirect(`${frontendUrl}?error=token_failed`);
        }

        // 2. Obtener datos del usuario
        const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`);
        const userData = await userRes.json();

        // 3. Obtener páginas del usuario
        const pagesRes = await fetch(`https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${tokenData.access_token}`);
        const pagesData = await pagesRes.json();

        // 4. Guardar en base de datos usando tabla 'cuentas'
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        if (pagesData.data && pagesData.data.length > 0) {
            for (const page of pagesData.data) {
                await db.execute(
                    `INSERT INTO cuentas (plataforma, usuario, token)
                     VALUES ('facebook', ?, ?)
                     ON DUPLICATE KEY UPDATE token = VALUES(token)`,
                    [page.name, page.access_token]
                );
            }
        }

        await db.end();

        // 5. Redirigir al dashboard
        res.redirect(`${frontendUrl}/dashboard?user=${encodeURIComponent(userData.name)}`);

    } catch (err) {
        console.error('Callback error:', err);
        res.redirect(`${frontendUrl}?error=server_error`);
    }
}
