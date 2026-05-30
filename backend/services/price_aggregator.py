"""
Agrega precios reales de varios mercados y devuelve el promedio y los 5 más baratos.
"""
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

from services import cache
from services.marketplaces import (
    MARKETPLACES,
    csfloat_search_url,
    dmarket_search_url,
    skinport_search_url,
    steam_listing_url,
    waxpeer_search_url,
)

STEAM_PRICE_URL = "https://steamcommunity.com/market/priceoverview/"
SKINPORT_ITEMS_URL = "https://api.skinport.com/v1/items"
DMARKET_ITEMS_URL = "https://api.dmarket.com/exchange/v1/market/items"
WAXPEER_PRICES_URL = "https://api.waxpeer.com/v1/prices"
CSFLOAT_LISTINGS_URL = "https://csfloat.com/api/v1/listings"

HEADERS_BR = {
    "Accept-Encoding": "br",
    "Accept": "application/json",
    "User-Agent": "CS2Armery/1.0 (price-comparison; educational)",
}

# TTLs (segundos): índices masivos 4 h, detalle 10 min
INDEX_TTL = int(os.environ.get("PRICE_INDEX_TTL_SECONDS", str(4 * 3600)))
DETAIL_PRICE_TTL = int(os.environ.get("DETAIL_PRICE_TTL_SECONDS", str(10 * 60)))


def _parse_steam_price(text):
    """Convierte '$41.49' o '41,49€' a float USD aproximado."""
    if not text:
        return None
    cleaned = re.sub(r"[^\d.,]", "", text)
    if not cleaned:
        return None
    if "," in cleaned and "." in cleaned:
        cleaned = cleaned.replace(",", "")
    elif "," in cleaned:
        cleaned = cleaned.replace(",", ".")
    try:
        return round(float(cleaned), 2)
    except ValueError:
        return None


def fetch_steam_price(market_hash_name):
    cache_key = f"steam:{market_hash_name}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            STEAM_PRICE_URL,
            params={
                "appid": 730,
                "currency": 1,
                "market_hash_name": market_hash_name,
            },
            timeout=12,
            headers={"User-Agent": HEADERS_BR["User-Agent"]},
        )
        data = response.json()
        if not data.get("success"):
            cache.set(cache_key, None, ttl_seconds=120)
            return None

        price = _parse_steam_price(data.get("lowest_price") or data.get("median_price"))
        result = {
            "marketplace_id": "steam",
            "price_usd": price,
            "url": steam_listing_url(market_hash_name),
            "available": price is not None,
            "note": "Precio más bajo en Steam",
        }
        cache.set(cache_key, result, ttl_seconds=DETAIL_PRICE_TTL)
        return result
    except Exception:
        cache.set(cache_key, None, ttl_seconds=60)
        return None


def _fetch_skinport_index_from_api():
    response = requests.get(
        SKINPORT_ITEMS_URL,
        params={"app_id": 730, "currency": "USD", "tradable": 0},
        timeout=90,
        headers=HEADERS_BR,
    )
    response.raise_for_status()
    index = {}
    for item in response.json():
        name = item.get("market_hash_name")
        if not name:
            continue
        min_price = item.get("min_price")
        if min_price is None:
            continue
        index[name] = {
            "price_usd": round(float(min_price), 2),
            "url": item.get("item_page") or skinport_search_url(name),
        }
    cache.set("skinport_index", index, ttl_seconds=INDEX_TTL, persist=True)
    return index


def _load_skinport_index(force=False):
    if not force:
        cached = cache.get("skinport_index")
        if cached:
            return cached

    return _fetch_skinport_index_from_api()


def fetch_skinport_price(market_hash_name):
    try:
        index = _load_skinport_index()
        entry = index.get(market_hash_name)
        if not entry:
            return None
        return {
            "marketplace_id": "skinport",
            "price_usd": entry["price_usd"],
            "url": entry["url"],
            "available": True,
            "note": "Precio mínimo listado",
        }
    except Exception:
        return None


def _fetch_waxpeer_index_from_api():
    response = requests.get(
        WAXPEER_PRICES_URL,
        params={"game": "csgo"},
        timeout=60,
        headers={"User-Agent": HEADERS_BR["User-Agent"]},
    )
    response.raise_for_status()
    index = {}
    for item in response.json().get("items", []):
        name = item.get("name", "").replace("\ufffd", "™")
        min_val = item.get("min")
        if name and min_val:
            index[name] = round(float(min_val) / 1000, 2)
    cache.set("waxpeer_index", index, ttl_seconds=INDEX_TTL, persist=True)
    return index


def _load_waxpeer_index(force=False):
    if not force:
        cached = cache.get("waxpeer_index")
        if cached:
            return cached
    return _fetch_waxpeer_index_from_api()


def refresh_market_indexes(force=False):
    """Precarga o renueva índices masivos Skinport + Waxpeer."""
    _load_skinport_index(force=force)
    _load_waxpeer_index(force=force)


def fetch_waxpeer_price(market_hash_name):
    try:
        index = _load_waxpeer_index()
        price = index.get(market_hash_name)
        if price is None:
            return None
        return {
            "marketplace_id": "waxpeer",
            "price_usd": price,
            "url": waxpeer_search_url(market_hash_name),
            "available": True,
            "note": "Mejor oferta P2P",
        }
    except Exception:
        return None


def fetch_dmarket_price(market_hash_name):
    cache_key = f"dmarket:{market_hash_name}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            DMARKET_ITEMS_URL,
            params={
                "gameId": "a8db",
                "title": market_hash_name,
                "currency": "USD",
                "limit": 5,
                "orderBy": "best_deal",
            },
            timeout=15,
            headers={"Accept": "application/json"},
        )
        data = response.json()
        objects = data.get("objects", [])
        best = None
        for obj in objects:
            if obj.get("title") != market_hash_name:
                continue
            usd_cents = obj.get("price", {}).get("USD")
            if usd_cents:
                price = round(int(usd_cents) / 100, 2)
                if best is None or price < best:
                    best = price

        if best is None:
            cache.set(cache_key, None, ttl_seconds=180)
            return None

        result = {
            "marketplace_id": "dmarket",
            "price_usd": best,
            "url": dmarket_search_url(market_hash_name),
            "available": True,
            "note": "Mejor listing activo",
        }
        cache.set(cache_key, result, ttl_seconds=DETAIL_PRICE_TTL)
        return result
    except Exception:
        cache.set(cache_key, None, ttl_seconds=60)
        return None


def fetch_csfloat_price(market_hash_name):
    """CSFloat a veces bloquea peticiones sin API key; lo intentamos igual."""
    cache_key = f"csfloat:{market_hash_name}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        response = requests.get(
            CSFLOAT_LISTINGS_URL,
            params={
                "market_hash_name": market_hash_name,
                "limit": 5,
                "sort_by": "lowest_price",
                "type": "buy_now",
            },
            timeout=12,
            headers=HEADERS_BR,
        )
        if response.status_code != 200:
            cache.set(cache_key, None, ttl_seconds=DETAIL_PRICE_TTL)
            return None

        listings = response.json() or []
        prices = []
        for listing in listings:
            cents = listing.get("price")
            if cents is not None:
                prices.append(round(int(cents) / 100, 2))

        if not prices:
            cache.set(cache_key, None, ttl_seconds=DETAIL_PRICE_TTL)
            return None

        result = {
            "marketplace_id": "csfloat",
            "price_usd": min(prices),
            "url": csfloat_search_url(market_hash_name),
            "available": True,
            "note": "Listing más barato",
        }
        cache.set(cache_key, result, ttl_seconds=DETAIL_PRICE_TTL)
        return result
    except Exception:
        cache.set(cache_key, None, ttl_seconds=120)
        return None


def get_list_preview_price(market_hash_name):
    """Precio rápido para tarjetas del listado (solo cachés masivos)."""
    for fetcher in (fetch_waxpeer_price, fetch_skinport_price):
        result = fetcher(market_hash_name)
        if result and result.get("price_usd"):
            return result["price_usd"]
    return None


def aggregate_prices(market_hash_name):
    """
    Consulta todos los proveedores en paralelo y construye la respuesta final.
    """
    fetchers = [
        fetch_steam_price,
        fetch_skinport_price,
        fetch_dmarket_price,
        fetch_waxpeer_price,
        fetch_csfloat_price,
    ]

    offers = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = {pool.submit(fn, market_hash_name): fn.__name__ for fn in fetchers}
        for future in as_completed(futures):
            result = future.result()
            if result and result.get("price_usd") is not None:
                meta = MARKETPLACES.get(result["marketplace_id"], {})
                offers.append(
                    {
                        **result,
                        "marketplace_name": meta.get("name", result["marketplace_id"]),
                        "marketplace_color": meta.get("color", "#888"),
                        "logo": meta.get("logo", "🏷️"),
                    }
                )

    offers.sort(key=lambda o: o["price_usd"])
    prices = [o["price_usd"] for o in offers]
    average = round(sum(prices) / len(prices), 2) if prices else None

    return {
        "market_hash_name": market_hash_name,
        "average_price_usd": average,
        "sources_count": len(offers),
        "top_cheapest": offers[:5],
        "all_offers": offers,
        "currency": "USD",
    }


def enrich_list_with_prices(items):
    """Añade precio orientativo a cada ítem del listado."""
    enriched = []
    for item in items:
        copy = dict(item)
        copy["preview_price_usd"] = get_list_preview_price(item["market_hash_name"])
        enriched.append(copy)
    return enriched
