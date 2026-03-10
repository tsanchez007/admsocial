const express = require('express');
const db      = require('../database');
const router  = express.Router();

router.get('/', async (req, res) => {
    const [accounts] = await db.query('SELECT * FROM accounts WHERE status = "connected"');
    res.json({ success: true, accounts });
});

router.post('/', async (req, res) => {
    const { platform, username, access_token, page_id, ig_account_id } = req.body;
    await db.query(
        'INSERT INTO accounts (platform, username, access_token, page_id, ig_account_id) VALUES (?, ?, ?, ?, ?)',
        [platform, username, access_token, page_id || null, ig_account_id || null]
    );
    res.json({ success: true, message: 'Cuenta conectada' });
});

router.delete('/:id', async (req, res) => {
    await db.query('UPDATE accounts SET status = ? WHERE id = ?', ['disconnected', req.params.id]);
    res.json({ success: true });
});

module.exports = router;
