export default async function handler(req, res) {
    const { code, error } = req.query;
    if (error) return res.status(400).send(`Error de Meta: ${error}`);

    try {
        const redirectUri = `${process.env.FRONTEND_URL}/api/auth/callback`;
        
        const tokenRes = await fetch(`https://graph.facebook.com/${process.env.META_API_VERSION}/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`);
        const tokenData = await tokenRes.json();
        
        if (tokenData.error) {
            return res.status(400).json({ error: tokenData.error });
        }

        res.redirect(`${process.env.FRONTEND_URL}/?connected=true`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.message);
        res.status(500).send('Error procesando el login: ' + err.message);
    }
}
