import { LEGAL } from '../content/legalSite';

/** Configuración SEO central (producción: globalskinmetrics.com). */
export const SITE_SEO = {
  name: LEGAL.siteName,
  titleSuffix: LEGAL.siteName,
  url: LEGAL.url,
  locale: 'es_ES',
  language: 'es',
  defaultTitle: `${LEGAL.siteName} | Comparador de precios de skins CS2`,
  defaultDescription:
    'Compara precios de skins, cuchillos y objetos de Counter-Strike 2 en Steam, Skinport, DMarket, Waxpeer y más. Precios actualizados y ofertas en un solo lugar.',
  defaultKeywords:
    'CS2 skins, precios skins CS2, comparador skins, Counter-Strike 2, Steam market, Skinport, DMarket, Global Skin Metrics',
  themeColor: '#0a0c10',
  twitterCard: 'summary_large_image',
};

const PUBLIC_ROUTES = {
  '/': {
    title: 'Global Skin Metrics | Comparador de precios de skins CS2',
    description: SITE_SEO.defaultDescription,
  },
  '/suscripciones': {
    title: 'Suscripciones y herramientas premium',
    description: `Planes y herramientas premium de ${LEGAL.siteName}: alertas, CSBot y funciones para traders de skins CS2.`,
  },
  '/aviso-legal': {
    title: 'Aviso legal',
    description: `Información legal y datos del titular del sitio ${LEGAL.siteName}.`,
    noindex: false,
  },
  '/privacidad': {
    title: 'Política de privacidad',
    description: `Cómo tratamos tus datos personales en ${LEGAL.siteName} (RGPD).`,
  },
  '/cookies': {
    title: 'Política de cookies',
    description: `Uso de cookies y publicidad en ${LEGAL.siteName}.`,
  },
  '/terminos': {
    title: 'Términos y condiciones',
    description: `Condiciones de uso del comparador ${LEGAL.siteName}.`,
  },
  '/contacto': {
    title: 'Contacto',
    description: `Contacta con el equipo de ${LEGAL.siteName}: soporte y patrocinios.`,
  },
};

const NOINDEX_PREFIXES = ['/admin', '/cuenta', '/profile'];

export function getSeoForPath(pathname) {
  if (NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return {
      title: LEGAL.siteName,
      description: SITE_SEO.defaultDescription,
      noindex: true,
      canonicalPath: pathname,
    };
  }

  if (pathname.startsWith('/arma/')) {
    return {
      title: 'Precio y ofertas CS2',
      description:
        'Consulta el precio medio y las mejores ofertas de esta skin u objeto de CS2 en varios mercados.',
      canonicalPath: pathname,
    };
  }

  if (pathname.startsWith('/suscripciones/')) {
    return {
      ...PUBLIC_ROUTES['/suscripciones'],
      canonicalPath: pathname,
    };
  }

  return {
    ...(PUBLIC_ROUTES[pathname] || {
      title: SITE_SEO.defaultTitle,
      description: SITE_SEO.defaultDescription,
    }),
    canonicalPath: pathname,
  };
}

export function buildTitle(pageTitle) {
  if (!pageTitle) return SITE_SEO.defaultTitle;
  return `${pageTitle} | ${SITE_SEO.titleSuffix}`;
}

export function buildCanonical(path) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_SEO.url}${clean}`;
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_SEO.name,
    url: SITE_SEO.url,
    description: SITE_SEO.defaultDescription,
    inLanguage: SITE_SEO.language,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_SEO.url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_SEO.name,
    url: SITE_SEO.url,
    email: LEGAL.emails.public,
  };
}
