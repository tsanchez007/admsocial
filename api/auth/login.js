export default function handler(req, res) {
    const scope = [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'public_profile'
    ].join(',');

    const redirectUri = encodeURIComponent(`${process.env.FRONTEND_URL}/api/auth/callback`);
    const url = `https://www.facebook.com/${process.env.META_API_VERSION}/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
    
    res.redirect(url);
}
