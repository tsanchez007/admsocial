export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Conectar cuenta - SocialApp</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.card { background: white; border-radius: 16px; padding: 48px 40px; max-width: 420px; width: 90%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
.logo { font-size: 2.5rem; margin-bottom: 16px; }
h1 { font-size: 1.5rem; color: #333; margin-bottom: 8px; }
p { color: #777; font-size: 0.95rem; margin-bottom: 32px; line-height: 1.5; }
.btn { display: inline-block; background: #1877F2; color: white; padding: 14px 32px; border-radius: 8px; font-size: 1rem; font-weight: 600; text-decoration: none; border: none; cursor: pointer; width: 100%; }
.btn:hover { background: #166fe5; }
</style>
</head>
<body>
<div class="card">
    <div class="logo">✦</div>
    <h1>Conectar tu cuenta</h1>
    <p>Haz clic en el botón para conectar tu cuenta de Facebook e Instagram con SocialApp.</p>
    <a href="/api/auth/login" class="btn">🔗 Conectar con Facebook / Instagram</a>
</div>
</body>
</html>`);
}
