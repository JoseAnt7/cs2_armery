# SkinAtlas

Comparador de precios de skins y armas de **Counter-Strike 2**. Lista el catálogo por categorías, busca skins y al abrir una ficha muestra el **precio promedio** entre varios mercados y los **5 sitios más baratos**.

## Mercados consultados

| Mercado | Método |
|---------|--------|
| Steam Community Market | API pública `priceoverview` |
| Skinport | API REST `/v1/items` |
| DMarket | API REST de listados |
| Waxpeer | API pública de precios |
| CSFloat | API de listings (puede estar limitada) |

Los precios son **reales** cuando la API responde. Steam aplica rate limits; el backend usa caché para no saturar las peticiones.

## Requisitos

- Python 3.10+
- Node.js 18+

## Arranque rápido

### Backend (Flask)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python app.py
```

El API queda en `http://127.0.0.1:5000`.

La primera vez descarga el catálogo de skins desde [ByMykel CSGO-API](https://github.com/ByMykel/CSGO-API) y lo guarda en `backend/data/catalog_cache.json`.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. Vite hace proxy de `/api` al backend.

## Estructura del proyecto

```
backend/
  app.py                 # Entrada Flask
  routes.py              # Auth (registro/login)
  routes_weapons.py      # API del comparador
  services/
    catalog.py           # Catálogo de skins
    price_aggregator.py  # Precios multi-mercado
    marketplaces.py      # URLs y metadatos
frontend/
  src/
    Pages/Home.jsx       # Listado y filtros
    Pages/WeaponDetail.jsx
    components/          # UI reutilizable
    api/client.js        # Llamadas al backend
```

## API principal

- `GET /api/weapons/categories` — Categorías (rifles, pistolas, cuchillos…)
- `GET /api/weapons?category=&q=&page=&sort=&prices=1` — Listado paginado
- `GET /api/weapons/:id` — Ficha con precio medio y top 5 ofertas

## Notas legales

Proyecto educativo. No está afiliado a Valve ni a los marketplaces. Revisa los términos de cada plataforma antes de automatizar peticiones en producción.
