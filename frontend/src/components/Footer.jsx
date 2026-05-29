import { Link } from 'react-router-dom';
import { reopenCookieBanner } from '../utils/cookieConsent';
import '../styles/layout.css';

export function Footer() {
  return (
    <footer className="site-footer">
      <p>
        Precios obtenidos de mercados públicos (Steam, Skinport, DMarket, Waxpeer y más).
        No afiliado a Valve. Los precios pueden variar en tiempo real.
      </p>
      <nav className="site-footer__legal" aria-label="Enlaces legales">
        <Link to="/aviso-legal">Aviso legal</Link>
        <Link to="/privacidad">Privacidad</Link>
        <Link to="/cookies">Cookies</Link>
        <Link to="/terminos">Términos</Link>
        <Link to="/contacto">Contacto</Link>
        <button
          type="button"
          className="site-footer__cookie-btn"
          onClick={reopenCookieBanner}
        >
          Configurar cookies
        </button>
      </nav>
    </footer>
  );
}
