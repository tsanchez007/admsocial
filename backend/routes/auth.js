const express = require('express');
const axios   = require('axios');
const db      = require('../database');
const crypto  = require('crypto');
const router  = express.Router();

const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyaq6CJ_MzxmoJJ7XygGV8PegelnNuTshZwZvmckGG5QLA1YF5obfLAiG7bHehgjGMt/exec';

const hashPassword = (password) =>
  crypto.createHash('sha256').update(password + 'admsocial_salt').digest('hex');

// ── Facebook OAuth ──────────────────────────────────────────────────
router.get('/login', (req, res) => {
    const scope = [
        'pages_manage_posts',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish',
        'pages_show_list',
        'public_profile'
    ].join(',');
    const url = `https://www.facebook.com/${process.env.META_API_VERSION}/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&response_type=code`;
    res.redirect(url);
});

router.get('/callback', async (req, res) => {
    const { code, error } = req.query;
    if (error) return res.status(400).send(`Error de Meta: ${error}`);
    try {
        const tokenRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/oauth/access_token`, {
            params: {
                client_id: process.env.META_APP_ID,
                client_secret: process.env.META_APP_SECRET,
                redirect_uri: REDIRECT_URI,
                code
            }
        });
        const userToken = tokenRes.data.access_token;
        const accountsRes = await axios.get(`https://graph.facebook.com/${process.env.META_API_VERSION}/me/accounts`, {
            params: {
                access_token: userToken,
                fields: 'name,access_token,id,instagram_business_account{id,username,name,profile_picture_url}'
            }
        });
        const pages = accountsRes.data.data || [];
        for (const page of pages) {
            await db.query(
                'INSERT INTO accounts (platform, username, access_token, page_id, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token=VALUES(access_token)',
                ['facebook', page.name, page.access_token, page.id, 'connected']
            );
            if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                await db.query(
                    'INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id, status) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE access_token=VALUES(access_token)',
                    ['instagram', ig.username, page.access_token, page.id, ig.id, 'connected']
                );
            }
        }
        res.redirect(`${FRONTEND_URL}/?connected=true`);
    } catch (err) {
        console.error('[AUTH ERROR]', err.response?.data || err.message);
        res.status(500).send('Error procesando el login');
    }
});

// ── Reset de contraseña ─────────────────────────────────────────────

// POST /api/auth/forgot → envía código via Apps Script
router.post('/forgot', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    try {
        // Verificar que el usuario existe
        const [users] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
        );

        // Siempre responder igual por seguridad
        if (!users.length) {
            return res.json({ success: true, message: 'Si el email existe, recibirás un código.' });
        }

        const user = users[0];
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS reset_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at DATETIME NOT NULL,
                used TINYINT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Borrar códigos anteriores
        await db.query('DELETE FROM reset_codes WHERE user_id = ?', [user.id]);

        // Guardar nuevo código
        await db.query(
            'INSERT INTO reset_codes (user_id, code, expires_at) VALUES (?, ?, ?)',
            [user.id, code, expiresAt]
        );

        // Enviar email via Apps Script
        const scriptRes = await axios.post(APPS_SCRIPT_URL, {
            action: 'send_only',
            email,
            code,
            nombre: user.nombre || user.username
        });

        return res.json({ success: true });

    } catch (err) {
        console.error('[forgot]', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/reset → verifica código y cambia contraseña
router.post('/reset', async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword)
        return res.status(400).json({ error: 'Email, código y nueva contraseña son requeridos' });
    if (newPassword.length < 6)
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    try {
        const [users] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
        );
        if (!users.length) return res.status(400).json({ error: 'Email no encontrado' });

        const user = users[0];

        const [codes] = await db.query(
            'SELECT * FROM reset_codes WHERE user_id = ? AND code = ? AND used = 0 AND expires_at > NOW()',
            [user.id, code]
        );
        if (!codes.length) return res.status(400).json({ error: 'Código inválido o expirado' });

        const hash = hashPassword(newPassword);
        await db.query('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, user.id]);
        await db.query('UPDATE reset_codes SET used = 1 WHERE user_id = ?', [user.id]);

        return res.json({ success: true, message: 'Contraseña actualizada exitosamente' });

    } catch (err) {
        console.error('[reset]', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/reset-direct → llamado desde Apps Script
router.post('/reset-direct', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
        return res.status(400).json({ error: 'Email y contraseña requeridos' });

    try {
        const hash = hashPassword(newPassword);
        await db.query('UPDATE usuarios SET password_hash = ? WHERE email = ?', [hash, email]);
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
