"""
Consultas al Steam Community Market (CS2, appid 730).
Obtiene precio de referencia y listings individuales parseando la página del mercado.
"""
import re
import statistics
import time
from urllib.parse import quote

import requests

from services import cache
from services.price_aggregator import _parse_steam_price

STEAM_APPID = 730
STEAM_CURRENCY_USD = 1
STEAM_PRICE_URL = "https://steamcommunity.com/market/priceoverview/"
STEAM_SEARCH_RENDER = "https://steamcommunity.com/market/search/render/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

LISTING_ROW_RE = re.compile(
    r'listingid\\\\\\":\\\\\\"(\d+)\\\\\\",\\\\\\"unPrice\\\\\\":(\d+),'
    r'\\\\\\"unFee\\\\\\":(\d+).{0,3200}?Exterior: ([^\\\\]+)',
    re.DOTALL,
)
GROUP_ID_RE = re.compile(r'market_bucket_group_id\\\\\\":\\\\\\"([^\\\\]+)')
HASH_NAME_RE = re.compile(
    r'listingid\\\\\\":\\\\\\"(\d+)\\\\\\".{0,3200}?'
    r'market_hash_name\\\\\\":\\\\\\"([^\\\\]+)',
    re.DOTALL,
)
WEAR_SUFFIX_RE = re.compile(
    r"^(.+) \((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$"
)

_last_request_at = 0.0
REQUEST_GAP_SEC = 1.2


def _throttle():
    global _last_request_at
    elapsed = time.monotonic() - _last_request_at
    if elapsed < REQUEST_GAP_SEC:
        time.sleep(REQUEST_GAP_SEC - elapsed)
    _last_request_at = time.monotonic()


def _session():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def split_hash_name(market_hash_name):
    m = WEAR_SUFFIX_RE.match(market_hash_name or "")
    if not m:
        return market_hash_name, None
    return m.group(1), m.group(2)


def build_hash_name(base_name, exterior):
    if not exterior:
        return base_name
    return f"{base_name} ({exterior.strip()})"


def steam_listing_url(group_id, listing_id=None, category_query=None):
    """URL al listing concreto en Steam (formato Market Beta)."""
    path = f"https://steamcommunity.com/market/listings/{STEAM_APPID}/{group_id}"
    params = []
    if category_query:
        params.append(category_query)
    if listing_id:
        params.append(f"detail={listing_id}")
        params.append("buy=1")
    if not params:
        return path
    return f"{path}?{'&'.join(params)}"


def steam_hash_listing_url(market_hash_name, listing_id=None):
    encoded = quote(market_hash_name)
    path = f"https://steamcommunity.com/market/listings/{STEAM_APPID}/{encoded}"
    if listing_id:
        return f"{path}?detail={listing_id}&buy=1"
    return path


def fetch_reference_price(market_hash_name):
    """Precio de referencia Steam (mediana de ventas o, si no hay, el más bajo)."""
    cache_key = f"steam_ref:{market_hash_name}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    _throttle()
    try:
        response = requests.get(
            STEAM_PRICE_URL,
            params={
                "appid": STEAM_APPID,
                "currency": STEAM_CURRENCY_USD,
                "market_hash_name": market_hash_name,
            },
            headers=HEADERS,
            timeout=14,
        )
        data = response.json()
        if not data.get("success"):
            cache.set(cache_key, None, ttl_seconds=120)
            return None

        median = _parse_steam_price(data.get("median_price"))
        lowest = _parse_steam_price(data.get("lowest_price"))
        reference = median or lowest
        result = {
            "reference_usd": reference,
            "median_usd": median,
            "lowest_usd": lowest,
            "volume": data.get("volume"),
        }
        cache.set(cache_key, result, ttl_seconds=300)
        return result
    except Exception:
        cache.set(cache_key, None, ttl_seconds=60)
        return None


def fetch_bucket_group_id(market_hash_name):
    cache_key = f"steam_gid:{market_hash_name}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    _throttle()
    try:
        response = requests.get(
            STEAM_SEARCH_RENDER,
            params={
                "query": market_hash_name,
                "start": 0,
                "count": 5,
                "search_descriptions": 0,
                "sort_column": "price",
                "sort_dir": "asc",
                "appid": STEAM_APPID,
                "norender": 1,
                "currency": STEAM_CURRENCY_USD,
            },
            headers=HEADERS,
            timeout=16,
        )
        data = response.json()
        for row in data.get("results") or []:
            if row.get("hash_name") == market_hash_name:
                asset = row.get("asset_description") or {}
                gid = asset.get("market_bucket_group_id")
                if gid:
                    cache.set(cache_key, gid, ttl_seconds=86400)
                    return gid
        for row in data.get("results") or []:
            asset = row.get("asset_description") or {}
            gid = asset.get("market_bucket_group_id")
            if gid:
                cache.set(cache_key, gid, ttl_seconds=86400)
                return gid
    except Exception:
        pass

    cache.set(cache_key, None, ttl_seconds=300)
    return None


def _fetch_listings_html(group_id):
    cache_key = f"steam_html:{group_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    _throttle()
    url = f"https://steamcommunity.com/market/listings/{STEAM_APPID}/{group_id}"
    try:
        response = requests.get(
            url,
            params={"currency": STEAM_CURRENCY_USD},
            headers=HEADERS,
            timeout=25,
        )
        html = response.text
        cache.set(cache_key, html, ttl_seconds=45)
        return html
    except Exception:
        return ""


def parse_listings_from_html(html, base_name=None):
    """
    Extrae listings con ID y precio desde el HTML del mercado (Market Beta).
  """
    listings = []
    if not html:
        return listings

    for match in HASH_NAME_RE.finditer(html):
        listing_id, market_hash_name = match.groups()
        chunk_start = match.start()
        chunk = html[chunk_start : chunk_start + 400]
        price_match = re.search(
            r'unPrice\\\\\\":(\d+),\\\\\\"unFee\\\\\\":(\d+)', chunk
        )
        if not price_match:
            continue
        price = (int(price_match.group(1)) + int(price_match.group(2))) / 100
        listings.append(
            {
                "listing_id": listing_id,
                "market_hash_name": market_hash_name,
                "price_usd": round(price, 2),
            }
        )

    if listings:
        return listings

    for listing_id, un_price, un_fee, exterior in LISTING_ROW_RE.findall(html):
        price = (int(un_price) + int(un_fee)) / 100
        market_hash_name = (
            build_hash_name(base_name, exterior) if base_name else None
        )
        listings.append(
            {
                "listing_id": listing_id,
                "market_hash_name": market_hash_name,
                "exterior": exterior.strip(),
                "price_usd": round(price, 2),
            }
        )

    return listings


def fetch_listings_for_group(group_id, base_name=None):
    cache_key = f"steam_listings:{group_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    html = _fetch_listings_html(group_id)
    listings = parse_listings_from_html(html, base_name=base_name)
    cache.set(cache_key, listings, ttl_seconds=40)
    return listings


def calc_drop_percent(reference_usd, listing_price_usd):
    if not reference_usd or reference_usd <= 0 or listing_price_usd is None:
        return None
    if listing_price_usd >= reference_usd:
        return 0.0
    return round((reference_usd - listing_price_usd) / reference_usd * 100, 1)


def reference_with_listing_fallback(market_hash_name, listings_for_hash):
    overview = fetch_reference_price(market_hash_name) or {}
    ref = overview.get("reference_usd")
    if ref:
        return ref, "steam_median" if overview.get("median_usd") else "steam_lowest"

    prices = [l["price_usd"] for l in listings_for_hash if l.get("price_usd")]
    if len(prices) >= 2:
        return round(statistics.median(prices), 2), "listings_median"
    if prices:
        return prices[0], "listing_only"
    return None, None


def scan_item_group(base_name, target_hashes, min_drop_percent, category_query=None):
    """
    Escanea un grupo de skins (misma skin, distintos desgastes) en Steam.
    target_hashes: set de market_hash_name a vigilar.
    """
    sample_hash = next(iter(target_hashes), None)
    if not sample_hash:
        return []

    group_id = fetch_bucket_group_id(sample_hash)
    if not group_id:
        return []

    listings = fetch_listings_for_group(group_id, base_name=base_name)
    by_hash = {}
    for row in listings:
        h = row.get("market_hash_name")
        if not h and row.get("exterior") and base_name:
            h = build_hash_name(base_name, row["exterior"])
            row["market_hash_name"] = h
        if h:
            by_hash.setdefault(h, []).append(row)

    matches = []
    for market_hash_name in target_hashes:
        item_listings = by_hash.get(market_hash_name, [])
        reference, ref_source = reference_with_listing_fallback(
            market_hash_name, item_listings
        )
        if not reference:
            continue

        for listing in item_listings:
            price = listing.get("price_usd")
            drop = calc_drop_percent(reference, price)
            if drop is None or drop < min_drop_percent:
                continue

            listing_id = listing.get("listing_id")
            url = steam_listing_url(
                group_id,
                listing_id=listing_id,
                category_query=category_query,
            )

            matches.append(
                {
                    "market_hash_name": market_hash_name,
                    "listing_id": listing_id,
                    "listing_price_usd": price,
                    "reference_price_usd": reference,
                    "reference_source": ref_source,
                    "drop_percent": drop,
                    "savings_usd": round(reference - price, 2),
                    "steam_url": url,
                    "steam_group_id": group_id,
                }
            )

    return matches
