import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  adminCreateUser,
  adminPatchUser,
  adminSetUserSubscription,
  fetchAdminStats,
  fetchAdminUsers,
  fetchSubscriptions,
} from '../api/client';
import '../styles/admin.css';

function getToken() {
  return localStorage.getItem('access_token');
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function Admin() {
  const token = getToken();
  const storedUser = getStoredUser();
  const [forbidden, setForbidden] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subsCatalog, setSubsCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    is_admin: false,
  });
  const [subEdit, setSubEdit] = useState({});

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.id - b.id),
    [users],
  );

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [s, u, catalog] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchSubscriptions({ includePlans: true }),
      ]);
      setStats(s);
      setUsers(u.items || []);
      setSubsCatalog(catalog.items || []);
      setForbidden(false);
    } catch (err) {
      const msg = String(err.message || '');
      if (/\b403\b|No autorizado|forbidden/i.test(msg)) {
        setForbidden(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadAll();
  }, [token, loadAll]);

  const handleCreateUser = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      try {
        await adminCreateUser({
          username: newUser.username.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          is_admin: newUser.is_admin,
        });
        setNewUser({ username: '', email: '', password: '', is_admin: false });
        await loadAll();
      } catch (err) {
        setError(err.message);
      }
    },
    [newUser, loadAll],
  );

  const toggleAdmin = useCallback(
    async (u) => {
      setError('');
      try {
        await adminPatchUser(u.id, { is_admin: !u.is_admin });
        await loadAll();
      } catch (err) {
        setError(err.message);
      }
    },
    [loadAll],
  );

  const planOptionsForSub = useCallback(
    (subSlug) => {
      const sub = subsCatalog.find((s) => s.slug === subSlug);
      return sub?.plans || [];
    },
    [subsCatalog],
  );

  const saveSubscription = useCallback(
    async (userId) => {
      const edit = subEdit[userId] || {};
      const activeRow = sortedUsers.find((x) => x.id === userId);
      const activeSubs = (activeRow?.subscriptions || []).filter((s) => s.is_active);

      let subscription_slug =
        edit.subscription_slug ||
        activeSubs[0]?.subscription?.slug ||
        subsCatalog[0]?.slug;

      const plans = planOptionsForSub(subscription_slug);
      let plan_slug =
        edit.plan_slug || activeSubs[0]?.plan?.slug || plans[0]?.slug;

      if (!subscription_slug || !plan_slug) {
        setError('No hay suscripciones en el sistema o plan no válido.');
        return;
      }
      setError('');
      try {
        await adminSetUserSubscription(userId, { subscription_slug, plan_slug });
        await loadAll();
      } catch (err) {
        setError(err.message);
      }
    },
    [subEdit, sortedUsers, subsCatalog, planOptionsForSub, loadAll],
  );

  if (!token) {
    return <Navigate to="/cuenta" replace state={{ from: '/admin' }} />;
  }

  if (loading) {
    return (
      <div className="admin-page">
        <p className="admin-hint">Cargando panel…</p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="admin-page">
        <div className="admin-forbidden">
          <h1>Acceso restringido</h1>
          <p>Solo pueden entrar usuarios administradores.</p>
          {storedUser && !storedUser.is_admin && (
            <p>Vuelve a iniciar sesión si un admin acaba de darte permisos.</p>
          )}
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Administración</h1>
          <p className="admin-page__subtitle">Estadísticas, usuarios y suscripciones</p>
        </div>
        <Link to="/" className="admin-back">
          ← Catálogo
        </Link>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {stats && (
        <section className="admin-stats admin-section">
          <h2 className="admin-section-title">Visitas (tracking)</h2>
          <p className="admin-note">
            Basado en eventos enviados desde el navegador (aprox. una por pestaña cada vez que entras).
            Rangos por fecha UTC actual.
          </p>
          <div className="admin-stats__grid">
            <div className="admin-stat-card">
              <span className="admin-stat-card__label">Hoy</span>
              <strong className="admin-stat-card__value">{stats.visits?.day ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__label">Este mes</span>
              <strong className="admin-stat-card__value">{stats.visits?.month ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__label">Este año</span>
              <strong className="admin-stat-card__value">{stats.visits?.year ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__label">Usuarios registrados</span>
              <strong className="admin-stat-card__value">{stats.users_total ?? 0}</strong>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__label">Administradores</span>
              <strong className="admin-stat-card__value">{stats.admins_total ?? 0}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="admin-section">
        <h2 className="admin-section-title">Crear usuario</h2>
        <form className="admin-form" onSubmit={handleCreateUser}>
          <label>
            Usuario
            <input
              value={newUser.username}
              onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
              minLength={6}
              required
            />
          </label>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={newUser.is_admin}
              onChange={(e) => setNewUser((p) => ({ ...p, is_admin: e.target.checked }))}
            />
            Crear como administrador
          </label>
          <button type="submit" className="admin-btn">
            Crear usuario
          </button>
        </form>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Usuarios</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Suscripciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u) => {
                const activeSubs = (u.subscriptions || []).filter((s) => s.is_active);
                const edit = subEdit[u.id] || {};
                const defaultSub = subsCatalog[0];
                const selSub =
                  edit.subscription_slug ||
                  activeSubs[0]?.subscription?.slug ||
                  defaultSub?.slug;
                const plans = planOptionsForSub(selSub);
                const selPlan =
                  edit.plan_slug ||
                  activeSubs[0]?.plan?.slug ||
                  plans[0]?.slug;

                return (
                  <tr key={u.id}>
                    <td data-label="ID">{u.id}</td>
                    <td data-label="Usuario">{u.username}</td>
                    <td data-label="Email">{u.email}</td>
                    <td data-label="Rol">
                      <span className={u.is_admin ? 'admin-badge admin-badge--gold' : 'admin-badge'}>
                        {u.is_admin ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td data-label="Suscripciones">
                      <ul className="admin-sub-list">
                        {activeSubs.length === 0 && <li className="muted">Ninguna activa</li>}
                        {activeSubs.map((s) => (
                          <li key={s.id}>
                            {s.subscription?.name} · {s.plan?.name}
                          </li>
                        ))}
                      </ul>
                      <div className="admin-sub-form">
                        <select
                          value={selSub || ''}
                          onChange={(e) =>
                            setSubEdit((prev) => ({
                              ...prev,
                              [u.id]: {
                                subscription_slug: e.target.value,
                                plan_slug: '',
                              },
                            }))
                          }
                          className="admin-select"
                        >
                          {subsCatalog.map((sub) => (
                            <option key={sub.slug} value={sub.slug}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selPlan || ''}
                          onChange={(e) =>
                            setSubEdit((prev) => ({
                              ...prev,
                              [u.id]: {
                                subscription_slug:
                                  prev[u.id]?.subscription_slug || selSub,
                                plan_slug: e.target.value,
                              },
                            }))
                          }
                          className="admin-select"
                        >
                          {(planOptionsForSub(selSub) || []).map((p) => (
                            <option key={p.slug} value={p.slug}>
                              {p.name} ({p.price_eur}€)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          onClick={() => saveSubscription(u.id)}
                        >
                          Guardar suscripción
                        </button>
                      </div>
                    </td>
                    <td data-label="Acciones">
                      <button
                        type="button"
                        className="admin-btn admin-btn--outline"
                        onClick={() => toggleAdmin(u)}
                      >
                        {u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section admin-bootstrap-hint">
        <h2 className="admin-section-title">Primer administrador</h2>
        <p>
          Define <code>ADMIN_BOOTSTRAP_TOKEN</code> en el entorno del backend y ejecuta{' '}
          <code>POST /api/admin/bootstrap</code> con el header{' '}
          <code>X-Admin-Bootstrap-Token</code> para crear la primera cuenta admin (solo si aún no
          existe ningún admin).
        </p>
      </section>
    </div>
  );
}
