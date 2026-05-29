import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { fetchProfile } from '../api/client';
import { useSiteConfig } from '../context/SiteConfigContext';
import '../styles/layout.css';
import '../styles/auth.css';

const MOBILE_NAV_MQ = '(max-width: 767px)';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function SiteNavLinks({ user, onClose, onLogout }) {
  const { settings } = useSiteConfig();
  const hideSubsPublic = Boolean(settings?.hide_subscriptions_public);
  const canSeeSubs = !hideSubsPublic || Boolean(user?.is_admin);

  return (
    <>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
        onClick={onClose}
      >
        Catálogo
      </NavLink>
      {canSeeSubs && (
        <NavLink
          to="/suscripciones"
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
          onClick={onClose}
        >
          Suscripciones
        </NavLink>
      )}
      {user ? (
        <>
          {user?.is_admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link--active' : ''}`
              }
              onClick={onClose}
            >
              Admin
            </NavLink>
          )}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link--active' : ''}`
            }
            onClick={onClose}
          >
            Mi perfil
          </NavLink>
          <span className="nav-user">
            Hola, <strong>{user.username}</strong>
          </span>
          <button type="button" className="nav-link" onClick={onLogout}>
            Salir
          </button>
        </>
      ) : (
        <NavLink
          to="/cuenta"
          className={({ isActive }) =>
            `nav-link nav-link--cta ${isActive ? 'nav-link--active' : ''}`
          }
          onClick={onClose}
        >
          Iniciar sesión
        </NavLink>
      )}
    </>
  );
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getStoredUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_NAV_MQ).matches,
  );

  useEffect(() => {
    function refreshUser() {
      setUser(getStoredUser());
    }
    window.addEventListener('auth-changed', refreshUser);
    window.addEventListener('storage', refreshUser);
    return () => {
      window.removeEventListener('auth-changed', refreshUser);
      window.removeEventListener('storage', refreshUser);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetchProfile()
      .then((data) => {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen && isMobile ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, isMobile]);

  function handleLogout() {
    setMenuOpen(false);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const mobileDrawer =
    menuOpen &&
    isMobile &&
    createPortal(
      <>
        <button
          type="button"
          className="nav-overlay nav-overlay--visible"
          aria-label="Cerrar menú"
          onClick={closeMenu}
        />
        <nav
          id="site-nav"
          className="site-nav site-nav--open site-nav--mobile-drawer"
          aria-label="Navegación principal"
        >
          <SiteNavLinks user={user} onClose={closeMenu} onLogout={handleLogout} />
        </nav>
      </>,
      document.body,
    );

  return (
    <>
      <header
        className={`site-header ${menuOpen && isMobile ? 'site-header--menu-open' : ''}`}
      >
        <div className="site-header__inner">
          <Link to="/" className="brand" onClick={closeMenu}>
            <div className="brand__logo">A</div>
            <div className="brand__text">
              <span className="brand__name">Global Skin Metrics</span>
              <span className="brand__tagline">Comparador de precios</span>
            </div>
          </Link>

          {isMobile && (
            <button
              type="button"
              className={`nav-toggle ${menuOpen ? 'nav-toggle--open' : ''}`}
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="nav-toggle__bars" aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
          )}

          {!isMobile && (
            <nav id="site-nav" className="site-nav" aria-label="Navegación principal">
              <SiteNavLinks user={user} onClose={closeMenu} onLogout={handleLogout} />
            </nav>
          )}
        </div>
      </header>
      {mobileDrawer}
    </>
  );
}
