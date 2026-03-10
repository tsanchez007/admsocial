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

router.get('/', (req, res) => {
    const posts = db.prepare('SELECT * FROM posts ORDER BY scheduled_at ASC').all();
    res.json({ success: true, posts });
});

router.post('/', upload.single('image'), (req, res) => {
    const { text, scheduled_at, instagram, facebook } = req.body;
    if (!scheduled_at) return res.status(400).json({ success: false, error: 'La fecha es requerida' });
    if (new Date(scheduled_at) <= new Date()) return res.status(400).json({ success: false, error: 'La fecha debe ser futura' });

    const imageUrl = req.file ? `http://localhost:3000/uploads/${req.file.filename}` : null;
    const result = db.prepare(
        'INSERT INTO posts (text, image_url, scheduled_at, instagram, facebook) VALUES (?, ?, ?, ?, ?)'
    ).run(text || '', imageUrl, scheduled_at, instagram === 'true' ? 1 : 0, facebook === 'true' ? 1 : 0);

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, post });
});

router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

module.exports = router;