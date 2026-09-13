const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function seatsLeft(eventId) {
  const event = db.prepare('SELECT seats FROM events WHERE id = ?').get(eventId);
  if (!event) return null;
  const active = db
    .prepare(
      `SELECT COUNT(*) AS c FROM registrations
       WHERE event_id = ? AND status = 'active'`
    )
    .get(eventId).c;
  return { event, left: event.seats - active };
}

router.get('/mine', authRequired, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id AS registration_id, r.registered_at, r.status,
              e.id, e.title, e.description, e.category, e.date, e.time,
              e.location, e.seats, e.image
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ? AND r.status = 'active'
       ORDER BY e.date ASC, e.time ASC`
    )
    .all(req.user.id);

  res.json({ registrations: rows });
});

router.post('/', authRequired, (req, res) => {
  const eventId = Number(req.body.event_id);
  if (!eventId) {
    return res.status(400).json({ message: 'Укажите мероприятие' });
  }

  const info = seatsLeft(eventId);
  if (!info) {
    return res.status(404).json({ message: 'Мероприятие не найдено' });
  }

  const existing = db
    .prepare('SELECT * FROM registrations WHERE user_id = ? AND event_id = ?')
    .get(req.user.id, eventId);

  if (existing?.status === 'active') {
    return res.status(409).json({ message: 'Вы уже зарегистрированы на это мероприятие' });
  }

  if (info.left <= 0) {
    return res.status(409).json({ message: 'Свободных мест нет' });
  }

  if (existing) {
    db.prepare(
      `UPDATE registrations SET status = 'active', registered_at = datetime('now')
       WHERE id = ?`
    ).run(existing.id);
  } else {
    db.prepare(
      `INSERT INTO registrations (user_id, event_id, status)
       VALUES (?, ?, 'active')`
    ).run(req.user.id, eventId);
  }

  res.status(201).json({ message: 'Регистрация на мероприятие успешна' });
});

router.delete('/:eventId', authRequired, (req, res) => {
  const eventId = Number(req.params.eventId);
  const reg = db
    .prepare(
      `SELECT * FROM registrations
       WHERE user_id = ? AND event_id = ? AND status = 'active'`
    )
    .get(req.user.id, eventId);

  if (!reg) {
    return res.status(404).json({ message: 'Активная регистрация не найдена' });
  }

  db.prepare(`UPDATE registrations SET status = 'cancelled' WHERE id = ?`).run(reg.id);
  res.json({ message: 'Регистрация отменена' });
});

module.exports = router;
