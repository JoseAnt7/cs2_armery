import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { deleteAccount, fetchProfile, updateProfile } from '../api/client';
import { ProfileSubscriptionsSection } from '../components/ProfileSubscriptionsSection';
import '../styles/profile.css';
import '../styles/auth.css';

const SECTIONS = [
  { id: 'account', label: 'Datos de la Cuenta', icon: '👤' },
  { id: 'subscriptions', label: 'Subscripciones', icon: '⭐' },
  { id: 'alerts', label: 'Avisos Personalizados', icon: '🔔', locked: true },
  { id: 'delete', label: 'Eliminar Cuenta', icon: '🗑️' },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AccountSection({ user, onUpdated }) {
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage({ type: '', text: '' });

    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (form.password && form.password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
      };
      if (form.password) payload.password = form.password;

      const data = await updateProfile(payload);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-changed'));
      onUpdated(data.user);
      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setMessage({ type: 'success', text: 'Datos actualizados correctamente' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="profile-section__title">Datos de la Cuenta</h2>
      <p className="profile-section__desc">
        Consulta y edita la información de tu perfil
      </p>

      <div className="profile-readonly">
        <div className="profile-readonly__row">
          <span className="profile-readonly__label">Miembro desde</span>
          <span className="profile-readonly__value">{formatDate(user.created_at)}</span>
        </div>
        <div className="profile-readonly__row">
          <span className="profile-readonly__label">ID de cuenta</span>
          <span className="profile-readonly__value">#{user.id}</span>
        </div>
      </div>

      <form className="profile-form auth-form" style={{ padding: 0 }} onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="profile-username">Usuario</label>
          <input
            id="profile-username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="profile-password">Nueva contraseña (opcional)</label>
          <input
            id="profile-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Dejar vacío para no cambiar"
          />
        </div>
        {form.password && (
          <div className="form-field">
            <label htmlFor="profile-confirm">Confirmar contraseña</label>
            <input
              id="profile-confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
        )}
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      {message.text && (
        <p className={`profile-message profile-message--${message.type}`}>{message.text}</p>
      )}
    </section>
  );
}

function PlaceholderSection({ title, description, text, locked }) {
  return (
    <section>
      <h2 className="profile-section__title">{title}</h2>
      <p className="profile-section__desc">{description}</p>
      <div className={`profile-placeholder ${locked ? 'profile-placeholder--locked' : ''}`}>
        {locked && <div className="profile-placeholder__icon" aria-hidden>🔒</div>}
        <p>{text}</p>
      </div>
    </section>
  );
}

function DeleteSection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  async function handleDelete() {
    const confirmed = window.confirm(
      '¿Estás seguro? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await deleteAccount();
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 className="profile-section__title">Eliminar Cuenta</h2>
      <p className="profile-section__desc">Acción permanente e irreversible</p>

      <div className="profile-delete-box">
        <p>
          Confirma que tus datos serán eliminados de nuestra base de datos y no podrán
          recuperarse. Si estás conforme, pulsa el botón de abajo.
        </p>
        <button
          type="button"
          className="profile-delete-btn"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Eliminando…' : 'Eliminar mi cuenta'}
        </button>
      </div>

      {message.text && (
        <p className={`profile-message profile-message--${message.type}`}>{message.text}</p>
      )}
    </section>
  );
}

export function Profile() {
  const token = localStorage.getItem('access_token');
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(
    location.state?.section || 'account'
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetchProfile()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-changed'));
      })
      .catch((err) => {
        const authError = /Subject must be a string|Missing Authorization|Token|401|422/i.test(
          err.message
        );
        if (authError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-changed'));
        }
        setError(
          authError
            ? 'Tu sesión ha expirado o no es válida. Inicia sesión de nuevo.'
            : err.message
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return <Navigate to="/cuenta" replace />;
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner" />
        <p>Cargando tu perfil…</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="profile-guard">
        <p>{error || 'No se pudo cargar el perfil'}</p>
        <Link to="/cuenta" className="profile-guard__link">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  function renderSection() {
    switch (activeSection) {
      case 'account':
        return <AccountSection user={user} onUpdated={setUser} />;
      case 'subscriptions':
        return <ProfileSubscriptionsSection />;
      case 'alerts':
        return (
          <PlaceholderSection
            title="Avisos Personalizados"
            description="Configura alertas de precio para tus skins favoritas"
            text="Aquí irán los avisos personalizados. Esta función está bloqueada de momento."
            locked
          />
        );
      case 'delete':
        return <DeleteSection />;
      default:
        return null;
    }
  }

  return (
    <div className="profile-page">
      <aside className="profile-sidebar">
        <h1 className="profile-sidebar__title">Mi cuenta</h1>
        <ul className="profile-nav">
          {SECTIONS.map((section) => (
            <li key={section.id} className="profile-nav__item">
              <button
                type="button"
                className={`profile-nav__btn ${
                  activeSection === section.id ? 'profile-nav__btn--active' : ''
                } ${section.locked ? 'profile-nav__btn--locked' : ''}`}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                <span className="profile-nav__icon" aria-hidden>{section.icon}</span>
                {section.label}
                {section.locked && <span className="profile-nav__lock">🔒</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="profile-content">{renderSection()}</div>
    </div>
  );
}
