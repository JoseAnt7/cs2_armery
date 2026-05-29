# SEO — Global Skin Metrics

## Qué está implementado en el código

- **`index.html`**: idioma `es`, meta description, Open Graph, Twitter Card, canonical.
- **`SeoRouteWatcher`**: título y descripción por ruta (React).
- **`/arma/:id`**: meta dinámica con nombre del ítem + JSON-LD `Product`.
- **`public/robots.txt`**: permite indexar el sitio; bloquea `/admin`, `/cuenta`, `/profile`.
- **`public/sitemap.xml`**: URLs principales (home, legales, contacto, suscripciones).

Tras `npm run build`, `robots.txt` y `sitemap.xml` se copian a `dist/` y Nginx los sirve en la raíz.

## Por qué aún no sale en Google

1. **Dominio nuevo**: Google tarda días o semanas en rastrear e indexar.
2. **SPA (React)**: Google renderiza JavaScript, pero tarda más que HTML estático. Las fichas `/arma/...` se descubren por enlaces internos del catálogo.
3. **Falta registrar el sitio** en [Google Search Console](https://search.google.com/search-console).
4. **Sin enlaces externos** hacia `globalskinmetrics.com` el posicionamiento es más lento.

## Pasos recomendados (fuera del código)

1. **Google Search Console**
   - Añadir propiedad `https://globalskinmetrics.com`
   - Verificar dominio (DNS TXT o archivo HTML)
   - Enviar sitemap: `https://globalskinmetrics.com/sitemap.xml`
   - Solicitar indexación de la home

2. **Contenido**
   - Mantener textos útiles en home y legales (ya hecho).
   - El catálogo con miles de skins ayuda si cada ficha tiene enlace desde listados.

3. **Rendimiento**
   - Core Web Vitals razonables (imágenes lazy, buen hosting).

4. **AdSense**
   - Páginas legales, cookies y contenido visible alinean con requisitos de AdSense.
   - SEO no garantiza aprobación, pero reduce motivos de rechazo por “sitio vacío o incompleto”.

## Mejoras futuras (opcional)

- Sitemap dinámico con todas las URLs `/arma/{id}` (script en backend).
- Pre-render (SSR) o prerender estático para fichas más indexables.
- Imagen `og:image` dedicada (1200×630) en `/public/og-global-skin-metrics.jpg`.
- Blog o guías (“cómo comprar skins CS2”) para más palabras clave.

## Comprobar meta en producción

- Ver código fuente inicial: `curl -s https://globalskinmetrics.com/ | head -40`
- Rich Results Test: https://search.google.com/test/rich-results
- Inspección de URL en Search Console
