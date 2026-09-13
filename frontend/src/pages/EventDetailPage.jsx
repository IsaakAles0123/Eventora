import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

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

export default function EventDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setError('');
    try {
      const data = await api(`/api/events/${id}`);
      setEvent(data.event);

      if (user) {
        const mine = await api('/api/registrations/mine');
        setRegistered(mine.registrations.some((r) => r.id === Number(id)));
      } else {
        setRegistered(false);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  async function register() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const data = await api('/api/registrations', {
        method: 'POST',
        body: { event_id: Number(id) },
      });
      setMessage(data.message);
      setRegistered(true);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const data = await api(`/api/registrations/${id}`, { method: 'DELETE' });
      setMessage(data.message);
      setRegistered(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !event) {
    return (
      <section className="page">
        <div className="alert alert-error">{error}</div>
        <Link to="/events">← К списку</Link>
      </section>
    );
  }

  if (!event) {
    return <div className="page-loading">Загрузка…</div>;
  }

  const full = event.seats_left <= 0;

  return (
    <section className="page event-detail">
      <Link to="/events" className="back-link">
        ← Все мероприятия
      </Link>

      <div className="detail-layout">
        <div className="detail-media">
          {event.image ? (
            <img src={event.image} alt="" />
          ) : (
            <div className={`event-cover cover-large cover-${event.category.length % 5}`} />
          )}
        </div>

        <div className="detail-body">
          <span className="event-category">{event.category}</span>
          <h1>{event.title}</h1>
          <p className="detail-meta">
            {formatDate(event.date)} · {event.time}
            <br />
            {event.location}
          </p>
          <p className="detail-desc">{event.description}</p>
          <p className={full ? 'seats seats-full' : 'seats'}>
            Мест: {event.registered_count} / {event.seats}
            {full ? ' — запись закрыта' : ` · свободно ${event.seats_left}`}
          </p>

          {message && <div className="alert alert-ok">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          {!user ? (
            <p>
              Чтобы записаться, <Link to="/login">войдите</Link> или{' '}
              <Link to="/register">зарегистрируйтесь</Link>.
            </p>
          ) : registered ? (
            <button type="button" className="btn btn-ghost" onClick={cancel} disabled={busy}>
              Отменить регистрацию
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={register}
              disabled={busy || full}
            >
              {full ? 'Мест нет' : busy ? 'Запись…' : 'Записаться'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
