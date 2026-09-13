import { useEffect, useState } from 'react';
import { api } from '../api';
import EventCard from '../components/EventCard';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(params = {}) {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (params.q?.trim()) query.set('q', params.q.trim());
      if (params.category) query.set('category', params.category);
      if (params.date) query.set('date', params.date);
      const qs = query.toString();
      const data = await api(`/api/events${qs ? `?${qs}` : ''}`);
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api('/api/events/categories')
      .then((data) => setCategories(data.categories))
      .catch(() => {});
    load({});
  }, []);

  function onSearch(e) {
    e.preventDefault();
    load({ q, category, date });
  }

  function onReset() {
    setQ('');
    setCategory('');
    setDate('');
    load({});
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Мероприятия</h1>
        <p className="muted">Поиск по названию, фильтр по категории и дате</p>
      </div>

      <form className="filters" onSubmit={onSearch}>
        <input
          type="search"
          placeholder="Поиск по названию…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button type="submit" className="btn btn-primary">
          Найти
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Сбросить
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p className="muted">Загрузка…</p>
      ) : events.length === 0 ? (
        <p className="empty">Ничего не найдено</p>
      ) : (
        <div className="event-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
