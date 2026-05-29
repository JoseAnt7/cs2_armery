import { Link } from 'react-router-dom';
import '../styles/legal.css';

export function LegalLayout({ title, children }) {
  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <h1 className="legal-page__title">{title}</h1>
        <nav className="legal-page__nav" aria-label="Enlaces legales">
          <Link to="/aviso-legal">Aviso legal</Link>
          <Link to="/privacidad">Privacidad</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/terminos">Términos</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>
      </header>
      <div className="legal-page__body">{children}</div>
    </article>
  );
}
