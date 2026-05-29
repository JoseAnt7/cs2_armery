import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  applyGoogleConsentMode,
  getCookieConsent,
  hasConsentChoice,
  setCookieConsent,
} from '../utils/cookieConsent';
import '../styles/legal.css';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [ads, setAds] = useState(false);
  const [adsPersonalized, setAdsPersonalized] = useState(false);

  useEffect(() => {
    function sync() {
      if (!hasConsentChoice()) {
        setVisible(true);
        return;
      }
      const c = getCookieConsent();
      setAds(Boolean(c?.advertising));
      setAdsPersonalized(Boolean(c?.advertisingPersonalized));
      applyGoogleConsentMode();
      setVisible(false);
    }
    sync();
    window.addEventListener('cookie-consent-reopen', sync);
    return () => window.removeEventListener('cookie-consent-reopen', sync);
  }, []);

  function acceptAll() {
    setCookieConsent({
      advertising: true,
      advertisingPersonalized: true,
      analytics: false,
    });
    applyGoogleConsentMode();
    setVisible(false);
  }

  function acceptNecessaryOnly() {
    setCookieConsent({
      advertising: false,
      advertisingPersonalized: false,
      analytics: false,
    });
    applyGoogleConsentMode();
    setVisible(false);
  }

  function savePreferences() {
    setCookieConsent({
      advertising: ads,
      advertisingPersonalized: ads && adsPersonalized,
      analytics: false,
    });
    applyGoogleConsentMode();
    setVisible(false);
    setShowPrefs(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner__inner">
        <div>
          <p id="cookie-banner-title" className="cookie-banner__text">
            Usamos cookies necesarias para el funcionamiento del sitio y, con tu permiso,
            cookies de publicidad (Google AdSense) que pueden personalizarse según tus
            intereses. Puedes aceptar todas, rechazar las no esenciales o configurarlas. Más
            información en nuestra <Link to="/cookies">Política de cookies</Link> y{' '}
            <Link to="/privacidad">Privacidad</Link>.
          </p>
          {showPrefs && (
            <div className="cookie-banner__prefs">
              <label className="cookie-banner__pref">
                <input type="checkbox" checked disabled readOnly />
                <span>
                  <strong>Necesarias</strong> — imprescindibles (sesión, preferencias).
                </span>
              </label>
              <label className="cookie-banner__pref">
                <input
                  type="checkbox"
                  checked={ads}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setAds(on);
                    if (!on) setAdsPersonalized(false);
                  }}
                />
                <span>
                  <strong>Publicidad</strong> — anuncios de Google AdSense.
                </span>
              </label>
              <label className="cookie-banner__pref">
                <input
                  type="checkbox"
                  checked={adsPersonalized}
                  disabled={!ads}
                  onChange={(e) => setAdsPersonalized(e.target.checked)}
                />
                <span>
                  <strong>Publicidad personalizada</strong> — según tus visitas e intereses
                  (solo si aceptas publicidad).
                </span>
              </label>
            </div>
          )}
        </div>
        <div className="cookie-banner__actions">
          {showPrefs ? (
            <>
              <button type="button" className="cookie-banner__btn" onClick={() => setShowPrefs(false)}>
                Volver
              </button>
              <button type="button" className="cookie-banner__btn cookie-banner__btn--primary" onClick={savePreferences}>
                Guardar preferencias
              </button>
            </>
          ) : (
            <>
              <button type="button" className="cookie-banner__btn" onClick={acceptNecessaryOnly}>
                Solo necesarias
              </button>
              <button type="button" className="cookie-banner__btn" onClick={() => setShowPrefs(true)}>
                Configurar
              </button>
              <button type="button" className="cookie-banner__btn cookie-banner__btn--primary" onClick={acceptAll}>
                Aceptar todas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
