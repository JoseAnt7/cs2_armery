import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SITE_SEO,
  buildCanonical,
  buildTitle,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  getSeoForPath,
} from '../seo/siteSeo';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Actualiza title, meta y canonical. Usar en páginas concretas o dejar que SeoRouteWatcher infiera la ruta.
 */
export function Seo({
  title,
  description,
  canonicalPath,
  noindex = false,
  jsonLdExtra = null,
}) {
  const location = useLocation();
  const path = canonicalPath ?? location.pathname;
  const fullTitle = buildTitle(title);
  const desc = description || SITE_SEO.defaultDescription;
  const robots = noindex ? 'noindex, nofollow' : 'index, follow';
  const canonical = buildCanonical(path);

  useEffect(() => {
    document.title = fullTitle;
    document.documentElement.lang = SITE_SEO.language;

    upsertMeta('name', 'description', desc);
    upsertMeta('name', 'keywords', SITE_SEO.defaultKeywords);
    upsertMeta('name', 'robots', robots);
    upsertMeta('name', 'author', SITE_SEO.name);
    upsertMeta('name', 'theme-color', SITE_SEO.themeColor);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', SITE_SEO.name);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:locale', SITE_SEO.locale);

    upsertMeta('name', 'twitter:card', SITE_SEO.twitterCard);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);

    upsertLink('canonical', canonical);

    upsertJsonLd('jsonld-website', buildWebsiteJsonLd());
    upsertJsonLd('jsonld-organization', buildOrganizationJsonLd());
    if (jsonLdExtra) {
      upsertJsonLd('jsonld-page', jsonLdExtra);
    } else {
      const extra = document.getElementById('jsonld-page');
      if (extra) extra.remove();
    }
  }, [fullTitle, desc, robots, canonical, jsonLdExtra]);

  return null;
}

/** SEO por defecto según la ruta actual (App shell). */
export function SeoRouteWatcher() {
  const { pathname } = useLocation();
  const config = getSeoForPath(pathname);
  return (
    <Seo
      title={config.title}
      description={config.description}
      canonicalPath={config.canonicalPath}
      noindex={config.noindex}
    />
  );
}
