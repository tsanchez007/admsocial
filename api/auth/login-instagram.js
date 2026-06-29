export default function handler(req, res) {
    const appId   = process.env.INSTAGRAM_APP_ID;
    const baseUrl = (process.env.FRONTEND_URL || 'https://admsocial.vercel.app').replace(/["'\/]+$/, '');

    if (!appId) {
        return res.status(500).send('Falta configurar INSTAGRAM_APP_ID en las variables de entorno de Vercel.');
    }

    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback-instagram`);
    const scope       = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_comments,instagram_business_manage_messages';

    // enable_fb_login=0 fuerza login directo de Instagram (sin página de Facebook vinculada)
    const url = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    return res.redirect(302, url);
}
