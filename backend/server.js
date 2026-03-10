const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');
const { publishScheduledPosts } = require('./scheduler');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Corregido: Ahora usa __dirname (con dos guiones bajos)
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/posts', require('./routes/posts'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Cron Job cada minuto
cron.schedule('* * * * *', () => {
    console.log('[CRON] Revisando publicaciones...');
    publishScheduledPosts();
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});