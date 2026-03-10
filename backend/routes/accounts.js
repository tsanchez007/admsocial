const express = require('express');
const db      = require('../database');
const router  = express.Router();

router.get('/', (req, res) => {
    const accounts = db.prepare('SELECT id, platform, username, status, created_at FROM accounts').all();
    res.json({ success: true, accounts });
});

router.post('/', (req, res) => {
    const { platform, username, access_token, page_id, ig_account_id } = req.body;
    if (!platform || !username || !access_token) {
        return res.status(400).json({ success: false, error: 'Faltan datos requeridos' });
    }

    const existing = db.prepare('SELECT * FROM accounts WHERE platform = ? AND username = ?').get(platform, username);
    if (existing) {
        db.prepare('UPDATE accounts SET access_token = ?, status = ? WHERE id = ?')
          .run(access_token, 'connected', existing.id);
        return res.json({ success: true, message: 'Cuenta actualizada' });
    }

    db.prepare('INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id) VALUES (?, ?, ?, ?, ?)')
      .run(platform, username, access_token, page_id || null, ig_account_id || null);

    res.json({ success: true, message: 'Cuenta conectada' });
});

router.delete('/:id', (req, res) => {
    db.prepare('UPDATE accounts SET status = ? WHERE id = ?').run('disconnected', req.params.id);
    res.json({ success: true });
});

module.exports = router;