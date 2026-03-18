import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const { code, error } = req.query;
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const frontendUrl = (process.env.FRONTEND_URL || "https://admsocial.vercel.app").replace(/["']/g, "");
    const redirectUri = encodeURIComponent("https://admsocial.vercel.app/api/auth/callback");

    if (error) return res.redirect(`${frontendUrl}?error=${error}`);

    try {
        // 1. Obtener access token
        const tokenRes = await fetch(`https://graph.facebook.com/${apiVersion}/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) return res.redirect(`${frontendUrl}?error=token_failed`);

        // 2. Obtener datos del usuario
        const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${tokenData.access_token}`);
        const userData = await userRes.json();

        // 3. Obtener páginas del usuario
        const pagesRes = await fetch(`https://graph.facebook.com/${apiVersion}/me/accounts?access_token=${tokenData.access_token}`);
        const pagesData = await pagesRes.json();

        // 4. Guardar en base de datos
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        if (pagesData.data && pagesData.data.length > 0) {
            for (const page of pagesData.data) {
                // Guardar cuenta de Facebook con page_id real
                await db.execute(
                    `INSERT INTO cuentas (plataforma, usuario, token, page_id, nombre)
                     VALUES ('facebook', ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE token = VALUES(token), page_id = VALUES(page_id), nombre = VALUES(nombre)`,
                    [page.name, page.access_token, page.id, page.name]
                );

                // Buscar Instagram Business Account vinculado a esta página
                try {
                    const igRes = await fetch(`https://graph.facebook.com/${apiVersion}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
                    const igData = await igRes.json();

                    console.log('igData for', page.name, ':', JSON.stringify(igData));
                    if (igData.instagram_business_account?.id) {
                        const igId = igData.instagram_business_account.id;
                        // Obtener nombre del perfil de Instagram
                        const igProfileRes = await fetch(`https://graph.facebook.com/${apiVersion}/${igId}?fields=name,username&access_token=${page.access_token}`);
                        const igProfile = await igProfileRes.json();
                        const igName = igProfile.username || igProfile.name || page.name;

                        await db.execute(
                            `INSERT INTO cuentas (plataforma, usuario, token, page_id, ig_account_id, nombre)
                             VALUES ('instagram', ?, ?, ?, ?, ?)
                             ON DUPLICATE KEY UPDATE token = VALUES(token), ig_account_id = VALUES(ig_account_id), nombre = VALUES(nombre)`,
                            [igName, page.access_token, page.id, igId, igName]
                        );
                    }
                } catch(e) {
                    console.log('No Instagram account for page:', page.name, e.message, JSON.stringify(e));
                }
            }
        }

        await db.end();
        res.redirect(`${frontendUrl}/dashboard?user=${encodeURIComponent(userData.name)}`);

    } catch (err) {
        console.error('Callback error:', err);
        res.redirect(`${frontendUrl}?error=server_error`);
    }
}
