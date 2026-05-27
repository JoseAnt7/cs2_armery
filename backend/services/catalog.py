"""
Catálogo CS2 (skins, cajas, stickers y otros items de mercado).
Datos base: API pública de ByMykel (CSGO-API).
"""
import json
import re
from pathlib import Path

import requests

from services import cache

BYMYKEL_SKINS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json"
BYMYKEL_STICKERS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/stickers.json"
BYMYKEL_CASES_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json"
BYMYKEL_AGENTS_URL = "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/agents.json"
CACHE_FILE = Path(__file__).resolve().parent.parent / "data" / "catalog_cache.json"

# Categorías principales de mercado
SKIN_CATEGORIES = {
    "Rifles": "rifles",
    "Pistols": "pistols",
    "SMGs": "smgs",
    "Heavy": "heavy",
    "Sniper Rifles": "snipers",
    "Knives": "knives",
    "Gloves": "gloves",
}

# Desgastes que incluimos en el catálogo (reduce tamaño y coincide con el mercado)
WEARS_INCLUDED = {"Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"}

CATEGORY_LABELS = {
    "rifles": "Rifles",
    "pistols": "Pistolas",
    "smgs": "SMGs",
    "heavy": "Pesadas",
    "snipers": "Francotiradores",
    "knives": "Cuchillos",
    "gloves": "Guantes",
    "agents": "Agents",
    "stickers": "Stickers",
    "cases": "Cajas",
    "all": "Todas",
}
WEAR_FROM_NAME_RE = re.compile(r"\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$")


def _slugify(market_hash_name):
    slug = market_hash_name.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug).strip("-")
    return slug[:120] or "item"


def _build_market_hash_name(skin, wear_name, is_stattrak=False):
    base = skin["name"]
    if is_stattrak:
        base = f"StatTrak™ {base}"
    return f"{base} ({wear_name})"


def _parse_skins_to_catalog(skins_json):
    catalog = []
    for skin in skins_json:
        category_name = (skin.get("category") or {}).get("name")
        category_slug = SKIN_CATEGORIES.get(category_name)
        if not category_slug:
            continue

        wears = skin.get("wears") or [{"name": "Factory New"}]
        variants = [False, True] if skin.get("stattrak") else [False]
        for is_stattrak in variants:
            for wear in wears:
                wear_name = wear.get("name", "")
                if wear_name not in WEARS_INCLUDED:
                    continue

                market_hash_name = _build_market_hash_name(skin, wear_name, is_stattrak=is_stattrak)
                entry = {
                    "id": _slugify(market_hash_name),
                    "market_hash_name": market_hash_name,
                    "display_name": market_hash_name,
                    "weapon": (skin.get("weapon") or {}).get("name", ""),
                    "pattern": (skin.get("pattern") or {}).get("name", ""),
                    "category": category_slug,
                    "category_label": CATEGORY_LABELS.get(category_slug, category_slug),
                    "rarity": (skin.get("rarity") or {}).get("name", ""),
                    "rarity_color": (skin.get("rarity") or {}).get("color", "#b0c3d9"),
                    "image": skin.get("image", ""),
                    "stattrak": bool(is_stattrak),
                    "exterior": wear_name,
                }
                catalog.append(entry)

    catalog.sort(key=lambda x: x["market_hash_name"])
    return catalog


def _normalize_market_name(item):
    return (
        item.get("market_hash_name")
        or item.get("market_name")
        or item.get("name")
        or item.get("id")
        or "Unknown Item"
    )


def _parse_generic_items(items_json, category_slug):
    catalog = []
    for item in items_json or []:
        market_hash_name = _normalize_market_name(item)
        rarity = item.get("rarity") or {}
        if isinstance(rarity, dict):
            rarity_name = rarity.get("name", "")
            rarity_color = rarity.get("color", "#b0c3d9")
        else:
            rarity_name = str(rarity or "")
            rarity_color = "#b0c3d9"

        entry = {
            "id": _slugify(f"{category_slug}-{market_hash_name}"),
            "market_hash_name": market_hash_name,
            "display_name": market_hash_name,
            "weapon": "",
            "pattern": "",
            "category": category_slug,
            "category_label": CATEGORY_LABELS.get(category_slug, category_slug),
            "rarity": rarity_name,
            "rarity_color": rarity_color,
            "image": item.get("image", ""),
            "stattrak": False,
            "exterior": None,
        }
        catalog.append(entry)

    catalog.sort(key=lambda x: x["market_hash_name"])
    return catalog


def _fetch_json(url):
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        return response.json()
    except Exception:
        return []


def _load_from_disk():
    if CACHE_FILE.exists():
        with open(CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return None


def _save_to_disk(catalog):
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False)


def _hydrate_legacy_fields(items):
    changed = False
    for item in items:
        if "exterior" not in item:
            match = WEAR_FROM_NAME_RE.search(item.get("market_hash_name", ""))
            item["exterior"] = match.group(1) if match else None
            changed = True
        if not item.get("category_label"):
            item["category_label"] = CATEGORY_LABELS.get(item.get("category"), item.get("category", ""))
            changed = True
    return items, changed


def _catalog_has_extended_categories(items):
    categories = {item.get("category") for item in items}
    required = {"stickers", "cases", "agents"}
    return required.issubset(categories)


def load_catalog(force_refresh=False):
    """Carga el catálogo (memoria → disco → API ByMykel)."""
    if not force_refresh:
        cached = cache.get("catalog_full")
        if cached:
            hydrated, changed = _hydrate_legacy_fields(cached)
            if changed:
                cache.set("catalog_full", hydrated, ttl_seconds=86400)
            if _catalog_has_extended_categories(hydrated):
                return hydrated

        disk = _load_from_disk()
        if disk:
            hydrated, changed = _hydrate_legacy_fields(disk)
            if changed:
                _save_to_disk(hydrated)
            if _catalog_has_extended_categories(hydrated):
                cache.set("catalog_full", hydrated, ttl_seconds=86400)
                return hydrated

    skins = _fetch_json(BYMYKEL_SKINS_URL)
    stickers = _fetch_json(BYMYKEL_STICKERS_URL)
    cases = _fetch_json(BYMYKEL_CASES_URL)
    agents = _fetch_json(BYMYKEL_AGENTS_URL)

    catalog = []
    catalog.extend(_parse_skins_to_catalog(skins))
    catalog.extend(_parse_generic_items(stickers, "stickers"))
    catalog.extend(_parse_generic_items(cases, "cases"))
    catalog.extend(_parse_generic_items(agents, "agents"))
    catalog.sort(key=lambda x: x["market_hash_name"])

    _save_to_disk(catalog)
    cache.set("catalog_full", catalog, ttl_seconds=86400)
    return catalog


def get_categories():
    return [
        {"id": "all", "label": CATEGORY_LABELS["all"]},
        *[
            {"id": slug, "label": CATEGORY_LABELS[slug]}
            for slug in (
                *SKIN_CATEGORIES.values(),
                "stickers",
                "cases",
                "agents",
            )
        ],
    ]


def find_weapon(weapon_id):
    catalog = load_catalog()
    for item in catalog:
        if item["id"] == weapon_id:
            return item
    return None


def search_weapons(category="all", query="", page=1, limit=24, sort="name", exterior="all", rarity="all"):
    catalog = load_catalog()

    if category and category != "all":
        catalog = [w for w in catalog if w["category"] == category]

    if query:
        q = query.lower().strip()
        catalog = [
            w
            for w in catalog
            if q in w["market_hash_name"].lower()
            or q in w["weapon"].lower()
            or q in w["pattern"].lower()
        ]

    if exterior and exterior != "all":
        catalog = [w for w in catalog if (w.get("exterior") or "").lower() == exterior.lower()]

    if rarity and rarity != "all":
        catalog = [w for w in catalog if (w.get("rarity") or "").lower() == rarity.lower()]

    if sort == "name":
        catalog.sort(key=lambda w: w["market_hash_name"])
    elif sort == "rarity":
        rarity_order = [
            "Contraband",
            "Covert",
            "Classified",
            "Restricted",
            "Mil-Spec Grade",
            "Industrial Grade",
            "Consumer Grade",
            "Extraordinary",
        ]
        catalog.sort(
            key=lambda w: (
                rarity_order.index(w["rarity"])
                if w["rarity"] in rarity_order
                else 99,
                w["market_hash_name"],
            )
        )

    total = len(catalog)
    start = (page - 1) * limit
    end = start + limit
    items = catalog[start:end]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, (total + limit - 1) // limit),
    }


def get_filter_options():
    catalog = load_catalog()
    exteriors = sorted({w.get("exterior") for w in catalog if w.get("exterior")})
    rarity_map = {}
    for item in catalog:
        name = item.get("rarity")
        if not name:
            continue
        rarity_map[name] = item.get("rarity_color") or "#b0c3d9"
    rarities = [
        {"name": name, "color": color}
        for name, color in sorted(rarity_map.items())
    ]
    return {
        "exteriors": exteriors,
        "rarities": rarities,
    }
