const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../database');
const router  = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res) => {
    const [posts] = await db.query('SELECT * FROM posts ORDER BY scheduled_at ASC');
    res.json({ success: true, posts });
});

router.post('/', upload.single('image'), async (req, res) => {
    const { text, scheduled_at, instagram, facebook } = req.body;
    if (!scheduled_at) return res.status(400).json({ success: false, error: 'La fecha es requerida' });
    if (new Date(scheduled_at) <= new Date()) return res.status(400).json({ success: false, error: 'La fecha debe ser futura' });

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.query(
        'INSERT INTO posts (text, image_url, scheduled_at, instagram, facebook) VALUES (?, ?, ?, ?, ?)',
        [text || '', imageUrl, scheduled_at, instagram === 'true' ? 1 : 0, facebook === 'true' ? 1 : 0]
    );

    const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
    res.json({ success: true, post: rows[0] });
});

router.delete('/:id', async (req, res) => {
    await db.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;
