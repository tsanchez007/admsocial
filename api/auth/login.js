export default function handler(req, res) {
    const appId = process.env.META_APP_ID;
    const apiVersion = process.env.META_API_VERSION || 'v19.0';
    const frontendUrl = process.env.FRONTEND_URL;
    
    if (!appId) {
        return res.status(500).json({ error: 'META_APP_ID no configurado', env: Object.keys(process.env).filter(k => k.startsWith('META')) });
    }

    const scope = [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'public_profile'
    ].join(',');

    const redirectUri = encodeURIComponent(`${frontendUrl}/api/auth/callback`);
    const url = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    res.redirect(url);
}
