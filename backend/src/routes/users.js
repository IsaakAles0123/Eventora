const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
  };
}

router.get('/profile', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }
  res.json({ user: publicUser(user) });
});

router.put('/profile', authRequired, (req, res) => {
  const { name, email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const nextName = name?.trim() || user.name;
  const nextEmail = email?.trim().toLowerCase() || user.email;

  if (!nextName) {
    return res.status(400).json({ message: 'Имя не может быть пустым' });
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail);
  if (!emailOk) {
    return res.status(400).json({ message: 'Некорректный email' });
  }

  const conflict = db
    .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
    .get(nextEmail, user.id);
  if (conflict) {
    return res.status(409).json({ message: 'Этот email уже занят' });
  }

  let nextPassword = user.password;
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не короче 6 символов' });
    }
    nextPassword = bcrypt.hashSync(password, 10);
  }

  db.prepare('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?').run(
    nextName,
    nextEmail,
    nextPassword,
    user.id
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ user: publicUser(updated) });
});

module.exports = router;
