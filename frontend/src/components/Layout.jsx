import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          Eventora
        </Link>
        <nav className="nav">
          <NavLink to="/events">Мероприятия</NavLink>
          {user && <NavLink to="/my-events">Мои записи</NavLink>}
          {user && <NavLink to="/profile">Профиль</NavLink>}
          {isAdmin && <NavLink to="/admin">Админ</NavLink>}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="user-chip">{user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Войти
              </Link>
              <Link to="/register" className="btn btn-primary">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Eventora — платформа управления мероприятиями</p>
      </footer>
    </div>
  );
}
