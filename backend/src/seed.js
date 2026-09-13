require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@events.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Администратор';

function ensureAdmin() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
  if (existing) {
    console.log(`Админ уже есть: ${ADMIN_EMAIL}`);
    return;
  }

  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  db.prepare(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
  ).run(ADMIN_NAME, ADMIN_EMAIL, hash, 'admin');

  console.log(`Создан админ: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

function seedEvents() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM events').get().c;
  if (count > 0) {
    console.log(`Мероприятия уже есть (${count}), пропускаем seed`);
    return;
  }

  const events = [
    {
      title: 'IT-конференция Frontend Days',
      description:
        'Ежегодная конференция для frontend-разработчиков: React, Vue, доступность и производительность. Доклады, воркшопы и нетворкинг.',
      category: 'IT',
      date: '2026-10-15',
      time: '10:00',
      location: 'Москва, Экспоцентр',
      seats: 120,
    },
    {
      title: 'Мастер-класс по Python',
      description:
        'Практический мастер-класс: работа с API, SQLite и написание небольшого backend-сервиса с нуля.',
      category: 'Мастер-класс',
      date: '2026-09-28',
      time: '14:00',
      location: 'Онлайн (Zoom)',
      seats: 40,
    },
    {
      title: 'Лекция: История дизайна интерфейсов',
      description:
        'От первых GUI до современных дизайн-систем. Разбор кейсов и эволюции UX-паттернов.',
      category: 'Лекция',
      date: '2026-10-02',
      time: '18:30',
      location: 'Санкт-Петербург, коворкинг Neon',
      seats: 60,
    },
    {
      title: 'Городской забег 5 км',
      description:
        'Любительский забег по набережной. Регистрация обязательна, стартовый пакет выдаётся на месте.',
      category: 'Спорт',
      date: '2026-09-20',
      time: '09:00',
      location: 'Казань, Кремлёвская набережная',
      seats: 200,
    },
    {
      title: 'Бизнес-семинар для стартапов',
      description:
        'Как валидировать идею, собрать команду и найти первых клиентов. Выступления основателей и инвесторов.',
      category: 'Бизнес',
      date: '2026-11-05',
      time: '11:00',
      location: 'Екатеринбург, бизнес-центр Высоцкий',
      seats: 80,
    },
    {
      title: 'Выставка цифрового искусства',
      description:
        'Интерактивные инсталляции, NFT-работы и перформансы. Вход свободный по предварительной записи.',
      category: 'Выставка',
      date: '2026-10-22',
      time: '12:00',
      location: 'Новосибирск, Галерея Сибирь',
      seats: 150,
    },
  ];

  const insert = db.prepare(`
    INSERT INTO events (title, description, category, date, time, location, seats, image)
    VALUES (@title, @description, @category, @date, @time, @location, @seats, NULL)
  `);

  const tx = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  tx(events);
  console.log(`Добавлено мероприятий: ${events.length}`);
}

ensureAdmin();
seedEvents();
console.log('Seed завершён');
