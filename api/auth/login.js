export default function handler(req, res) {
    const scope = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish';
    const redirectUri = encodeURIComponent('https://admsocial.vercel.app/api/auth/callback');
    const state = req.headers.referer && req.headers.referer.includes('conectar') ? 'conectar' : 'dashboard';
    const url = 'https://www.facebook.com/v18.0/dialog/oauth?client_id=933367032511772&redirect_uri=' + redirectUri + '&scope=' + scope + '&response_type=code&state=' + state;
    return res.redirect(302, url);
}
