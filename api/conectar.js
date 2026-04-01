export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.end(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Conectar cuenta - Social ADM Group</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: linear-gradient(135deg, #6c63ff22, #f5f5f5); display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 90%; text-align: center; box-shadow: 0 8px 32px rgba(108,99,255,0.12); }
.logo { font-size: 3rem; margin-bottom: 12px; }
.brand { font-size: 1.1rem; font-weight: 700; color: #6c63ff; margin-bottom: 20px; letter-spacing: 0.5px; }
h1 { font-size: 1.5rem; color: #333; margin-bottom: 8px; font-weight: 700; }
p { color: #777; font-size: 0.95rem; margin-bottom: 24px; line-height: 1.6; }
.info-box { background: #f8f7ff; border-radius: 10px; padding: 16px; margin-bottom: 28px; text-align: left; }
.info-box p { margin: 0; font-size: 0.85rem; color: #555; }
.info-box p + p { margin-top: 8px; }
.info-box span { color: #6c63ff; font-weight: 600; }
.btn { display: block; background: #1877F2; color: white; padding: 16px 32px; border-radius: 10px; font-size: 1rem; font-weight: 600; text-decoration: none; width: 100%; transition: background 0.2s; }
.btn:hover { background: #166fe5; }
.footer { margin-top: 28px; font-size: 0.78rem; color: #aaa; line-height: 1.6; }
.footer a { color: #6c63ff; text-decoration: none; }
</style>
</head>
<body>
<div class="card">
    <div class="logo">✦</div>
    <div class="brand">Social ADM Group</div>
    <h1>Conectar tu cuenta</h1>
    <p>Para gestionar tus publicaciones en Facebook e Instagram desde nuestra plataforma, necesitamos que autorices el acceso.</p>
    <div class="info-box">
        <p><span>¿Qué permisos solicitamos?</span></p>
        <p>✔ Publicar contenido en tu nombre</p>
        <p>✔ Ver estadísticas de tus páginas</p>
        <p>✔ Gestionar comentarios</p>
        <p style="margin-top:12px;font-size:0.8rem;color:#aaa;">Nunca accedemos a tu contraseña ni datos personales.</p>
    </div>
    <a href="/api/auth/login" class="btn">🔗 Conectar con Facebook / Instagram</a>
    <div class="footer">
        Social ADM Group · Plataforma de gestión de redes sociales<br>
        <a href="/privacy.html">Política de privacidad</a> · Autorización oficial vía Meta
    </div>
</div>
</body>
</html>`);
}
