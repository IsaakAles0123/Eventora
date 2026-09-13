import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function formatDate(date) {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export default function MyEventsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const data = await api('/api/registrations/mine');
      setItems(data.registrations);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(eventId) {
    setMessage('');
    setError('');
    try {
      const data = await api(`/api/registrations/${eventId}`, { method: 'DELETE' });
      setMessage(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>Мои мероприятия</h1>
        <p className="muted">Активные записи</p>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {items.length === 0 ? (
        <p className="empty">
          Пока нет записей. <Link to="/events">Выбрать мероприятие</Link>
        </p>
      ) : (
        <ul className="my-list">
          {items.map((item) => (
            <li key={item.registration_id} className="my-item">
              <div>
                <h3>
                  <Link to={`/events/${item.id}`}>{item.title}</Link>
                </h3>
                <p className="muted">
                  {formatDate(item.date)} · {item.time} · {item.location}
                </p>
                <p className="hint">Запись от {item.registered_at}</p>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => cancel(item.id)}>
                Отменить
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
