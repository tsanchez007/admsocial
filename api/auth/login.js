export default function handler(req, res) {
    const appId = process.env.META_APP_ID;
    const apiVersion = process.env.META_API_VERSION || 'v18.0';
    const scope = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
    const redirectUri = encodeURIComponent('https://admsocial.vercel.app/api/auth/callback');
    const state = req.headers.referer && req.headers.referer.includes('conectar') ? 'conectar' : 'dashboard';
    const url = `https://www.facebook.com/${apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
    return res.redirect(302, url);
}
