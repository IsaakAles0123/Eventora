import { useEffect, useState } from 'react';
import { api } from '../api';

const emptyForm = {
  title: '',
  description: '',
  category: 'IT',
  date: '',
  time: '',
  location: '',
  seats: 50,
};

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [participants, setParticipants] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [s, e] = await Promise.all([api('/api/admin/stats'), api('/api/admin/events')]);
    setStats(s);
    setEvents(e.events);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message));
  }, []);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function startEdit(event) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      location: event.location,
      seats: event.seats,
    });
    setImage(null);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImage(null);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      if (image) body.append('image', image);

      if (editingId) {
        await api(`/api/events/${editingId}`, { method: 'PUT', body });
        setMessage('Мероприятие обновлено');
      } else {
        await api('/api/events', { method: 'POST', body });
        setMessage('Мероприятие создано');
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Удалить мероприятие?')) return;
    setError('');
    try {
      await api(`/api/events/${id}`, { method: 'DELETE' });
      setMessage('Мероприятие удалено');
      if (participants?.event?.id === id) setParticipants(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function showParticipants(id) {
    setError('');
    try {
      const data = await api(`/api/events/${id}/participants`);
      setParticipants(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Панель администратора</h1>
        <p className="muted">Управление мероприятиями и участниками</p>
      </div>

      {stats && (
        <div className="stats-row">
          <div>
            <strong>{stats.events}</strong>
            <span>мероприятий</span>
          </div>
          <div>
            <strong>{stats.users}</strong>
            <span>пользователей</span>
          </div>
          <div>
            <strong>{stats.registrations}</strong>
            <span>активных записей</span>
          </div>
        </div>
      )}

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form className="admin-form" onSubmit={onSubmit}>
        <h2>{editingId ? 'Редактировать мероприятие' : 'Добавить мероприятие'}</h2>
        <div className="admin-grid">
          <label>
            Название
            <input name="title" value={form.title} onChange={onChange} required />
          </label>
          <label>
            Категория
            <input name="category" value={form.category} onChange={onChange} required />
          </label>
          <label>
            Дата
            <input type="date" name="date" value={form.date} onChange={onChange} required />
          </label>
          <label>
            Время
            <input type="time" name="time" value={form.time} onChange={onChange} required />
          </label>
          <label>
            Место
            <input name="location" value={form.location} onChange={onChange} required />
          </label>
          <label>
            Мест
            <input
              type="number"
              name="seats"
              min="0"
              value={form.seats}
              onChange={onChange}
              required
            />
          </label>
          <label className="full">
            Описание
            <textarea name="description" rows={4} value={form.description} onChange={onChange} required />
          </label>
          <label className="full">
            Обложка
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </label>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <h2 className="section-title">Список мероприятий</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Дата</th>
              <th>Места</th>
              <th>Записи</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>
                  <strong>{event.title}</strong>
                  <div className="hint">{event.category}</div>
                </td>
                <td>
                  {event.date} {event.time}
                </td>
                <td>{event.seats}</td>
                <td>{event.registered_count}</td>
                <td className="table-actions">
                  <button type="button" className="btn btn-small" onClick={() => startEdit(event)}>
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="btn btn-small"
                    onClick={() => showParticipants(event.id)}
                  >
                    Участники
                  </button>
                  <button type="button" className="btn btn-small btn-danger" onClick={() => remove(event.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {participants && (
        <div className="participants">
          <h2>
            Участники: {participants.event.title} ({participants.total})
          </h2>
          {participants.participants.length === 0 ? (
            <p className="muted">Пока никто не записался</p>
          ) : (
            <ul>
              {participants.participants.map((p) => (
                <li key={p.registration_id}>
                  {p.name} — {p.email}
                  <span className="hint"> · {p.registered_at}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
