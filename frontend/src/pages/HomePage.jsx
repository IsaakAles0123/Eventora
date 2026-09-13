import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <section className="hero">
      <div className="hero-backdrop" aria-hidden />
      <div className="hero-content">
        <p className="brand-hero">Eventora</p>
        <h1>Мероприятия, на которые хочется прийти</h1>
        <p className="hero-lead">
          Создавайте события, находите интересные конференции и мастер-классы, записывайтесь в один клик.
        </p>
        <div className="hero-actions">
          <Link to="/events" className="btn btn-primary btn-lg">
            Смотреть мероприятия
          </Link>
          {!user && (
            <Link to="/register" className="btn btn-outline btn-lg">
              Создать аккаунт
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
