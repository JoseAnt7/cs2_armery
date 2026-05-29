const STORAGE_KEY = 'skinatlas_cookie_consent';

export const DEFAULT_CONSENT = {
  necessary: true,
  advertising: false,
  advertisingPersonalized: false,
  analytics: false,
  updatedAt: null,
};

export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...DEFAULT_CONSENT, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function setCookieConsent(consent) {
  const payload = {
    ...DEFAULT_CONSENT,
    ...consent,
    necessary: true,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event('cookie-consent-changed'));
  return payload;
}

export function hasConsentChoice() {
  return getCookieConsent() !== null;
}

export function canLoadAds() {
  const c = getCookieConsent();
  return Boolean(c?.advertising);
}

export function canLoadPersonalizedAds() {
  const c = getCookieConsent();
  return Boolean(c?.advertising && c?.advertisingPersonalized);
}

/** Para Google Consent Mode v2 (cuando integres AdSense). */
export function reopenCookieBanner() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('cookie-consent-reopen'));
}

export function applyGoogleConsentMode() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  const c = getCookieConsent();
  const adsGranted = c?.advertising ? 'granted' : 'denied';
  const personalized = c?.advertisingPersonalized ? 'granted' : 'denied';

  gtag('consent', 'update', {
    ad_storage: adsGranted,
    ad_user_data: personalized,
    ad_personalization: personalized,
    analytics_storage: c?.analytics ? 'granted' : 'denied',
  });
}
