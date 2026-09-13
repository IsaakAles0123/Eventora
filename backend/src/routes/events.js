const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `event-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Можно загружать только изображения'));
    }
    cb(null, true);
  },
});

function withStats(event) {
  const active = db
    .prepare(
      `SELECT COUNT(*) AS c FROM registrations
       WHERE event_id = ? AND status = 'active'`
    )
    .get(event.id).c;

  return {
    ...event,
    registered_count: active,
    seats_left: Math.max(0, event.seats - active),
  };
}

router.get('/', (req, res) => {
  const { q, category, date } = req.query;
  let sql = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (q?.trim()) {
    sql += ' AND LOWER(title) LIKE ?';
    params.push(`%${q.trim().toLowerCase()}%`);
  }
  if (category?.trim()) {
    sql += ' AND category = ?';
    params.push(category.trim());
  }
  if (date?.trim()) {
    sql += ' AND date = ?';
    params.push(date.trim());
  }

  sql += ' ORDER BY date ASC, time ASC';
  const rows = db.prepare(sql).all(...params).map(withStats);
  res.json({ events: rows });
});

router.get('/categories', (_req, res) => {
  const rows = db
    .prepare('SELECT DISTINCT category FROM events ORDER BY category')
    .all()
    .map((r) => r.category);
  res.json({ categories: rows });
});

router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Мероприятие не найдено' });
  }
  res.json({ event: withStats(event) });
});

router.post('/', authRequired, adminRequired, upload.single('image'), (req, res) => {
  try {
    const { title, description, category, date, time, location, seats } = req.body;

    if (!title?.trim() || !description?.trim() || !category?.trim() || !date || !time || !location?.trim()) {
      return res.status(400).json({ message: 'Заполните все обязательные поля' });
    }

    const seatsNum = Number(seats);
    if (!Number.isInteger(seatsNum) || seatsNum < 0) {
      return res.status(400).json({ message: 'Количество мест должно быть неотрицательным числом' });
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const result = db
      .prepare(
        `INSERT INTO events (title, description, category, date, time, location, seats, image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        title.trim(),
        description.trim(),
        category.trim(),
        date,
        time,
        location.trim(),
        seatsNum,
        image
      );

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ event: withStats(event) });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Ошибка создания мероприятия' });
  }
});

router.put('/:id', authRequired, adminRequired, upload.single('image'), (req, res) => {
  try {
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Мероприятие не найдено' });
    }

    const { title, description, category, date, time, location, seats } = req.body;
    const seatsNum = seats !== undefined ? Number(seats) : event.seats;

    if (!Number.isInteger(seatsNum) || seatsNum < 0) {
      return res.status(400).json({ message: 'Количество мест должно быть неотрицательным числом' });
    }

    let image = event.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    db.prepare(
      `UPDATE events SET title = ?, description = ?, category = ?, date = ?, time = ?,
       location = ?, seats = ?, image = ? WHERE id = ?`
    ).run(
      (title ?? event.title).trim(),
      (description ?? event.description).trim(),
      (category ?? event.category).trim(),
      date ?? event.date,
      time ?? event.time,
      (location ?? event.location).trim(),
      seatsNum,
      image,
      event.id
    );

    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
    res.json({ event: withStats(updated) });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Ошибка обновления мероприятия' });
  }
});

router.delete('/:id', authRequired, adminRequired, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Мероприятие не найдено' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(event.id);
  res.json({ message: 'Мероприятие удалено' });
});

router.get('/:id/participants', authRequired, adminRequired, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ message: 'Мероприятие не найдено' });
  }

  const participants = db
    .prepare(
      `SELECT r.id AS registration_id, r.registered_at, r.status,
              u.id AS user_id, u.name, u.email
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = ? AND r.status = 'active'
       ORDER BY r.registered_at DESC`
    )
    .all(event.id);

  res.json({
    event: withStats(event),
    participants,
    total: participants.length,
  });
});

module.exports = router;
