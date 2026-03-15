export default function handler(req, res) {
    const appId = process.env.META_APP_ID;
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const frontendUrl = process.env.FRONTEND_URL;

    const scope = [
        'public_profile',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts'
    ].join(',');

    const redirectUri = encodeURIComponent(`${frontendUrl}/api/auth/callback`);
    const url = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    res.redirect(url);
}
