import { Link } from 'react-router-dom';

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

export default function EventCard({ event }) {
  const full = event.seats_left <= 0;

  return (
    <article className="event-card">
      <Link to={`/events/${event.id}`} className="event-card-media">
        {event.image ? (
          <img src={event.image} alt="" />
        ) : (
          <div className={`event-cover cover-${(event.category || 'IT').length % 5}`} />
        )}
        <span className="event-category">{event.category}</span>
      </Link>
      <div className="event-card-body">
        <h3>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>
        <p className="event-meta">
          {formatDate(event.date)} · {event.time}
        </p>
        <p className="event-location">{event.location}</p>
        <div className="event-card-foot">
          <span className={full ? 'seats seats-full' : 'seats'}>
            {full ? 'Мест нет' : `Свободно: ${event.seats_left}`}
          </span>
          <Link to={`/events/${event.id}`} className="btn btn-small">
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  );
}
