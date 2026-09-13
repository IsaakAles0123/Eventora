require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

require('./db');
require('./seed');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><title>Eventora API</title></head>
<body style="font-family:system-ui;padding:2rem;line-height:1.5">
  <h1>Это API Eventora</h1>
  <p>Сайт открывайте здесь: <a href="http://localhost:5173">http://localhost:5173</a></p>
  <p>Проверка API: <a href="/api/health">/api/health</a></p>
</body></html>`);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Events Platform API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError || err.message?.includes('изображения')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}`);
});
