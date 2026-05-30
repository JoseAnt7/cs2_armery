import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  adminCreateUser,
  adminPatchSettings,
  adminPatchUser,
  adminSetUserSubscription,
  fetchAdminStats,
  fetchAdminSettings,
  fetchAdminUsers,
  fetchSubscriptions,
} from '../api/client';
import { useSiteConfig } from '../context/SiteConfigContext';
import { applyColorTheme, resolveColorTheme } from '../utils/applyColorTheme';
import '../styles/admin.css';

const COLOR_THEME_OPTIONS = [
  {
    id: 'orange',
    label: 'Naranja / dorado',
    description: 'Tema actual. Cálido y energético, ideal para destacar ofertas.',
    swatch: ['#f5a623', '#e67e22'],
  },
  {
    id: 'blue',
    label: 'Azul',
    description: 'Alineado con el logo. Enfocado en datos y métricas.',
    swatch: ['#4d9fff', '#2563eb'],
  },
];

const PUBLIC_PAGES = [
  {
    id: 'subscriptions',
    label: 'Suscripciones',
    path: '/suscripciones',
    settingKey: 'hide_subscriptions_public',
  },
];

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
  const { refresh: refreshSiteConfig } = useSiteConfig();
  const token = getToken();
  const [forbidden, setForbidden] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [subsCatalog, setSubsCatalog] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [draftHideSubs, setDraftHideSubs] = useState(false);
  const [savedHideSubs, setSavedHideSubs] = useState(false);
  const [draftTheme, setDraftTheme] = useState('orange');
  const [savedTheme, setSavedTheme] = useState('orange');
  const [savingSiteSettings, setSavingSiteSettings] = useState(false);
  const [siteSettingsMsg, setSiteSettingsMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    is_admin: false,
  });
  const [subEdit, setSubEdit] = useState({});
  const savedThemeRef = useRef('orange');
  savedThemeRef.current = savedTheme;

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
      const settingsRes = await fetchAdminSettings();
      setStats(s);
      setUsers(u.items || []);
      setSubsCatalog(catalog.items || []);
      const settings = settingsRes.settings || null;
      setSiteSettings(settings);
      const hideSubs = Boolean(settings?.hide_subscriptions_public);
      const theme = resolveColorTheme(settings?.color_theme);
      setDraftHideSubs(hideSubs);
      setSavedHideSubs(hideSubs);
      setDraftTheme(theme);
      setSavedTheme(theme);
      applyColorTheme(theme);
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

  useEffect(() => {
    return () => applyColorTheme(savedThemeRef.current);
  }, []);

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

  const siteSettingsDirty =
    draftHideSubs !== savedHideSubs || draftTheme !== savedTheme;

  function selectDraftTheme(themeId) {
    setSiteSettingsMsg('');
    const next = resolveColorTheme(themeId);
    setDraftTheme(next);
    applyColorTheme(next);
  }

  async function saveSiteSettings() {
    setError('');
    setSiteSettingsMsg('');
    setSavingSiteSettings(true);
    try {
      const res = await adminPatchSettings({
        hide_subscriptions_public: draftHideSubs,
        color_theme: draftTheme,
      });
      const settings = res.settings || null;
      const nextHide = Boolean(settings?.hide_subscriptions_public);
      const nextTheme = resolveColorTheme(settings?.color_theme);
      setSiteSettings(settings);
      setDraftHideSubs(nextHide);
      setSavedHideSubs(nextHide);
      setDraftTheme(nextTheme);
      setSavedTheme(nextTheme);
      applyColorTheme(nextTheme);
      await refreshSiteConfig();
      setSiteSettingsMsg('Cambios guardados');
    } catch (err) {
      setError(err.message);
      applyColorTheme(savedTheme);
      setDraftTheme(savedTheme);
    } finally {
      setSavingSiteSettings(false);
    }
  }

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
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Administración</h1>
          <p className="admin-page__subtitle">Estadísticas, usuarios y suscripciones</p>
        </div>
      </header>

      {error && <p className="admin-error">{error}</p>}

      <section className="admin-section">
        <h2 className="admin-section-title">Apariencia del sitio</h2>
        <p className="admin-note">
          Elige la paleta de acento (home, botones, enlaces activos, etc.). La vista previa se aplica al instante;
          pulsa Guardar para que todos los visitantes la vean.
        </p>
        <div className="admin-theme-grid" role="radiogroup" aria-label="Tema de color">
          {COLOR_THEME_OPTIONS.map((opt) => {
            const selected = draftTheme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`admin-theme-card ${selected ? 'admin-theme-card--active' : ''}`}
                onClick={() => selectDraftTheme(opt.id)}
              >
                <span className="admin-theme-card__swatches" aria-hidden>
                  {opt.swatch.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </span>
                <span className="admin-theme-card__label">{opt.label}</span>
                <span className="admin-theme-card__desc">{opt.description}</span>
                {selected && <span className="admin-theme-card__badge">Seleccionado</span>}
              </button>
            );
          })}
        </div>
        <p className="admin-theme-preview">
          Vista previa:{' '}
          <span className="admin-theme-preview__accent">skins CS2</span> en el título de la home.
        </p>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">Visibilidad de páginas</h2>
        <p className="admin-note">
          Controla qué secciones ve el público (visitantes y usuarios no admin). Los administradores siempre las ven.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table admin-visibility-table">
            <thead>
              <tr>
                <th>Página</th>
                <th>Ruta</th>
                <th>Visible al público</th>
              </tr>
            </thead>
            <tbody>
              {PUBLIC_PAGES.map((page) => {
                const isPublicVisible = !draftHideSubs;
                return (
                  <tr key={page.id}>
                    <td data-label="Página">{page.label}</td>
                    <td data-label="Ruta">
                      <code>{page.path}</code>
                    </td>
                    <td data-label="Visible al público">
                      <button
                        type="button"
                        className={`admin-visibility-toggle ${isPublicVisible ? 'admin-visibility-toggle--on' : 'admin-visibility-toggle--off'}`}
                        onClick={() => {
                          setSiteSettingsMsg('');
                          setDraftHideSubs((prev) => !prev);
                        }}
                        title={isPublicVisible ? 'Visible para el público' : 'Oculta para el público'}
                        aria-label={
                          isPublicVisible
                            ? 'Ocultar al público'
                            : 'Mostrar al público'
                        }
                      >
                        {isPublicVisible ? '👁' : '🚫'}
                      </button>
                      <span className="admin-visibility-status">
                        {isPublicVisible ? 'Visible' : 'Oculta'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="admin-visibility-actions">
          <button
            type="button"
            className="admin-btn"
            disabled={!siteSettingsDirty || savingSiteSettings}
            onClick={saveSiteSettings}
          >
            {savingSiteSettings ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {siteSettingsMsg && (
            <span className="admin-visibility-msg">{siteSettingsMsg}</span>
          )}
        </div>
      </section>

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
                        {u.is_admin ? (u.admin_protected ? 'Admin principal' : 'Admin') : 'Usuario'}
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
                      {!(u.admin_protected && u.is_admin) && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline"
                          onClick={() => toggleAdmin(u)}
                        >
                          {u.is_admin ? 'Quitar admin' : 'Hacer admin'}
                        </button>
                      )}
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
