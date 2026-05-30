"""
Rutas de la API para el comparador de precios de armas CS2.
"""
import os

from flask import Blueprint, jsonify, request

from services import cache, catalog, price_aggregator

weapons_bp = Blueprint("weapons", __name__)

LIST_CACHE_TTL = int(os.environ.get("LIST_RESPONSE_TTL_SECONDS", str(45 * 60)))


def _list_cache_key(category, query, exterior, rarity, page, limit, sort, include_prices):
    return (
        f"weapons_list:{category}:{query}:{exterior}:{rarity}:"
        f"{page}:{limit}:{sort}:{'1' if include_prices else '0'}"
    )


@weapons_bp.route("/api/weapons/categories", methods=["GET"])
def list_categories():
    return jsonify({"categories": catalog.get_categories()})


@weapons_bp.route("/api/weapons/filters", methods=["GET"])
def list_filters():
    return jsonify(catalog.get_filter_options())


@weapons_bp.route("/api/weapons", methods=["GET"])
def list_weapons():
    category = request.args.get("category", "all")
    query = request.args.get("q", "")
    exterior = request.args.get("exterior", "all")
    rarity = request.args.get("rarity", "all")
    page = max(1, request.args.get("page", 1, type=int))
    limit = min(48, max(1, request.args.get("limit", 24, type=int)))
    sort = request.args.get("sort", "name")
    include_prices = request.args.get("prices", "0") == "1"

    cache_key = _list_cache_key(
        category, query, exterior, rarity, page, limit, sort, include_prices
    )
    if include_prices:
        cached = cache.get(cache_key)
        if cached is not None:
            return jsonify(cached)

    result = catalog.search_weapons(
        category=category,
        query=query,
        exterior=exterior,
        rarity=rarity,
        page=page,
        limit=limit,
        sort=sort,
    )

    if include_prices:
        result["items"] = price_aggregator.enrich_list_with_prices(result["items"])
        cache.set(cache_key, result, ttl_seconds=LIST_CACHE_TTL, persist=True)

    return jsonify(result)


@weapons_bp.route("/api/weapons/<weapon_id>", methods=["GET"])
def weapon_detail(weapon_id):
    weapon = catalog.find_weapon(weapon_id)
    if not weapon:
        return jsonify({"error": "Arma no encontrada"}), 404

    pricing = price_aggregator.aggregate_prices(weapon["market_hash_name"])

    return jsonify(
        {
            "weapon": weapon,
            "pricing": pricing,
        }
    )


@weapons_bp.route("/api/health", methods=["GET"])
def health():
    from services.refresh_jobs import META_FILE

    meta = {}
    if META_FILE.exists():
        try:
            import json

            with open(META_FILE, encoding="utf-8") as f:
                meta = json.load(f)
        except (OSError, json.JSONDecodeError):
            pass

    return jsonify({
        "status": "ok",
        "app": "Global Skin Metrics",
        "cache_refresh": meta,
    })
