import mysql from 'mysql2/promise';

export default async function handler(req, res) {
    const { code, error, error_description } = req.query;
    const appId     = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const baseUrl   = (process.env.FRONTEND_URL || 'https://admsocial.vercel.app').replace(/["'\/]+$/, '');
    const redirectUri = `${baseUrl}/api/auth/callback-instagram`;

    if (error) return res.redirect(`${baseUrl}?error=${encodeURIComponent(error_description || error)}`);
    if (!code)  return res.redirect(`${baseUrl}?error=missing_code`);

    try {
        // 1. Intercambiar el code por un access_token de corta duración (1 hora)
        const form = new URLSearchParams();
        form.append('client_id',     appId);
        form.append('client_secret', appSecret);
        form.append('grant_type',    'authorization_code');
        form.append('redirect_uri',  redirectUri);
        form.append('code',          code);

        const shortRes  = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form });
        const shortData = await shortRes.json();
        if (!shortData.access_token) {
            console.error('IG short-lived token error:', JSON.stringify(shortData));
            return res.redirect(`${baseUrl}?error=ig_token_failed`);
        }

        // El intercambio de código también devuelve user_id — lo guardamos por si acaso
        const userIdFromToken = shortData.user_id ? String(shortData.user_id) : null;

        // 2. Canjear por un token de larga duración (60 días)
        const longRes  = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortData.access_token}`);
        const longData = await longRes.json();
        const accessToken = longData.access_token || shortData.access_token;

        // 3. Obtener el perfil — el campo correcto es "id", no "user_id"
        const profileRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${accessToken}`);
        const profile    = await profileRes.json();

        // Usar profile.id o el user_id que vino con el token
        const igId    = profile.id || userIdFromToken;
        const igUser  = profile.username || `ig_${igId}`;

        if (!igId) {
            console.error('IG profile error (sin id):', JSON.stringify(profile));
            return res.redirect(`${baseUrl}?error=ig_profile_failed`);
        }

        // 4. Guardar la cuenta — sin page_id (no depende de una página de Facebook)
        const db = await mysql.createConnection({
            host:     process.env.DB_HOST,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            timezone: 'Z',
        });

        await db.execute(
            `INSERT INTO cuentas (plataforma, usuario, token, page_id, ig_account_id, nombre)
             VALUES ('instagram', ?, ?, NULL, ?, ?)
             ON DUPLICATE KEY UPDATE token = VALUES(token), ig_account_id = VALUES(ig_account_id), nombre = VALUES(nombre)`,
            [igUser, accessToken, igId, igUser]
        );
        await db.end();

        res.redirect(`${baseUrl}/dashboard?user=${encodeURIComponent(igUser)}`);
    } catch (err) {
        console.error('Instagram callback error:', err);
        res.redirect(`${baseUrl}?error=server_error`);
    }
}
