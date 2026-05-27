"""
Definición de los mercados que comparamos y cómo enlazar a cada uno.
"""
from urllib.parse import quote

MARKETPLACES = {
    "steam": {
        "id": "steam",
        "name": "Steam Market",
        "short_name": "Steam",
        "color": "#1b2838",
        "logo": "🎮",
    },
    "skinport": {
        "id": "skinport",
        "name": "Skinport",
        "short_name": "Skinport",
        "color": "#ff5500",
        "logo": "🛒",
    },
    "dmarket": {
        "id": "dmarket",
        "name": "DMarket",
        "short_name": "DMarket",
        "color": "#00d4aa",
        "logo": "📊",
    },
    "waxpeer": {
        "id": "waxpeer",
        "name": "Waxpeer",
        "short_name": "Waxpeer",
        "color": "#7c4dff",
        "logo": "⚡",
    },
    "csfloat": {
        "id": "csfloat",
        "name": "CSFloat",
        "short_name": "CSFloat",
        "color": "#4fc3f7",
        "logo": "🔵",
    },
}


def steam_listing_url(market_hash_name):
    encoded = quote(market_hash_name)
    return f"https://steamcommunity.com/market/listings/730/{encoded}"


def skinport_search_url(market_hash_name):
    encoded = quote(market_hash_name)
    return f"https://skinport.com/market?search={encoded}"


def dmarket_search_url(market_hash_name):
    encoded = quote(market_hash_name)
    return f"https://dmarket.com/ingame-items/item-list/csgo-skins?title={encoded}"


def waxpeer_search_url(market_hash_name):
    encoded = quote(market_hash_name)
    return f"https://waxpeer.com/?sort=ASC&order=price&search={encoded}"


def csfloat_search_url(market_hash_name):
    encoded = quote(market_hash_name)
    return f"https://csfloat.com/search?market_hash_name={encoded}"
