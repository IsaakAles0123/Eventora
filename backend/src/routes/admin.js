const express = require('express');
const db = require('../db');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, adminRequired);

router.get('/stats', (_req, res) => {
  const users = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const events = db.prepare('SELECT COUNT(*) AS c FROM events').get().c;
  const registrations = db
    .prepare(`SELECT COUNT(*) AS c FROM registrations WHERE status = 'active'`)
    .get().c;

  res.json({
    users,
    events,
    registrations,
  });
});

router.get('/events', (_req, res) => {
  const events = db
    .prepare(
      `SELECT e.*,
              (SELECT COUNT(*) FROM registrations r
               WHERE r.event_id = e.id AND r.status = 'active') AS registered_count
       FROM events e
       ORDER BY e.date ASC, e.time ASC`
    )
    .all()
    .map((e) => ({
      ...e,
      seats_left: Math.max(0, e.seats - e.registered_count),
    }));

  res.json({ events });
});

router.get('/users', (_req, res) => {
  const users = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.created_at,
              (SELECT COUNT(*) FROM registrations r
               WHERE r.user_id = u.id AND r.status = 'active') AS active_registrations
       FROM users u
       ORDER BY u.created_at ASC`
    )
    .all();

  res.json({ users });
});

module.exports = router;
