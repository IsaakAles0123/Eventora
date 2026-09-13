import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const body = { name, email };
      if (password) body.password = password;
      await api('/api/users/profile', { method: 'PUT', body });
      await refreshProfile();
      setPassword('');
      setMessage('Профиль обновлён');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page narrow">
      <h1>Личный кабинет</h1>
      <p className="muted">
        Роль: {user?.role === 'admin' ? 'Администратор' : 'Пользователь'} · с {user?.created_at}
      </p>

      <form className="auth-form inline-form" onSubmit={onSubmit}>
        {message && <div className="alert alert-ok">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          Имя
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Новый пароль (необязательно)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            placeholder="Оставьте пустым, чтобы не менять"
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Сохранение…' : 'Сохранить'}
        </button>
      </form>
    </section>
  );
}
