"""
CSBot: búsqueda activa de ofertas en Steam Community Market (CS2).
Compara cada listing frente al precio de referencia (mediana Steam).
"""
from collections import defaultdict

from services import catalog
from services.steam_market import (
    calc_drop_percent,
    fetch_bucket_group_id,
    fetch_listings_for_group,
    fetch_reference_price,
    reference_with_listing_fallback,
    scan_item_group,
    split_hash_name,
    steam_hash_listing_url,
    steam_listing_url,
)

PLAN_LIMITS = {
    'basic': {
        'max_weapons': 20,
        'max_categories': 1,
        'allow_all': False,
        'max_scan': 4,
        'label': 'Basic',
    },
    'advanced': {
        'max_weapons': 500,
        'max_categories': 3,
        'allow_all': False,
        'max_scan': 8,
        'label': 'Advanced',
    },
    '2pro': {
        'max_weapons': 5000,
        'max_categories': 99,
        'allow_all': True,
        'max_scan': 12,
        'label': '2Pro',
    },
}

STEAM_CATEGORY_QUERY = {
    'rifles': 'category_730_Type=tag_CSGO_Type_Rifle',
    'pistols': 'category_730_Type=tag_CSGO_Type_Pistol',
    'smgs': 'category_730_Type=tag_CSGO_Type_SMG',
    'heavy': 'category_730_Type=tag_CSGO_Type_Machinegun',
    'snipers': 'category_730_Type=tag_CSGO_Type_Sniper+Rifle',
    'knives': 'category_730_Type=tag_CSGO_Type_Knife',
    'gloves': 'category_730_Type=tag_CSGO_Type_Hands',
    'stickers': 'category_730_Type=tag_CSGO_Type_Sticker',
    'cases': 'category_730_Type=tag_CSGO_Type_WeaponCase',
    'agents': 'category_730_Type=tag_CSGO_Type_CustomPlayer',
}


def get_plan_limits(plan_slug):
    return PLAN_LIMITS.get(plan_slug, PLAN_LIMITS['basic'])


def _limit_items_by_skin_groups(items, max_groups):
    """Limita el catálogo a N skins distintas (agrupando desgastes)."""
    grouped = _group_items_by_skin(items)
    keys = sorted(grouped.keys())[:max_groups]
    return [entry for key in keys for entry in grouped[key]]


def resolve_items_to_scan(search_mode, categories, weapons, limits, exterior='all', rarity='all'):
    catalog_items = catalog.load_catalog()
    if exterior and exterior != 'all':
        catalog_items = [
            w for w in catalog_items
            if (w.get('exterior') or '').lower() == exterior.lower()
        ]
    if rarity and rarity != 'all':
        catalog_items = [
            w for w in catalog_items
            if (w.get('rarity') or '').lower() == rarity.lower()
        ]

    mode = search_mode or 'all'
    max_groups = limits['max_scan']

    if mode == 'weapons':
        names = set(weapons or [])
        items = [w for w in catalog_items if w['market_hash_name'] in names]
        if not items:
            from services.catalog import _slugify

            items = [
                {
                    'id': _slugify(name),
                    'market_hash_name': name,
                    'category': 'rifles',
                    'category_label': 'Rifles',
                }
                for name in names
            ]
        return items[: limits['max_weapons']]

    if mode == 'categories':
        cats = set(categories or [])
        items = [w for w in catalog_items if w['category'] in cats]
        return _limit_items_by_skin_groups(items, max_groups * 3)

    if mode == 'all' and limits['allow_all']:
        return _limit_items_by_skin_groups(catalog_items, max_groups * 3)

    return _limit_items_by_skin_groups(catalog_items, max_groups * 3)


def validate_search_request(plan_slug, search_mode, categories, weapons):
    limits = get_plan_limits(plan_slug)
    errors = []

    if search_mode == 'weapons':
        count = len(weapons or [])
        if count == 0:
            errors.append('Selecciona al menos un arma')
        if count > limits['max_weapons']:
            errors.append(f'Tu plan permite máximo {limits["max_weapons"]} armas')

    elif search_mode == 'categories':
        count = len(categories or [])
        if count == 0:
            errors.append('Selecciona al menos una categoría')
        if count > limits['max_categories']:
            errors.append(f'Tu plan permite máximo {limits["max_categories"]} categorías')

    elif search_mode == 'all' and not limits['allow_all']:
        errors.append('Tu plan no permite buscar en todo el catálogo. Usa categorías o armas concretas.')

    return errors, limits


def _category_query_for_items(items):
    cats = {item.get('category') for item in items if item.get('category')}
    if len(cats) == 1:
        return STEAM_CATEGORY_QUERY.get(next(iter(cats)))
    return None


def _group_items_by_skin(items):
    groups = defaultdict(list)
    for item in items:
        base, _wear = split_hash_name(item['market_hash_name'])
        groups[base or item['market_hash_name']].append(item)
    return groups


def _enrich_match(match, catalog_by_hash):
    item = catalog_by_hash.get(match['market_hash_name'], {})
    return {
        'id': item.get('id'),
        'market_hash_name': match['market_hash_name'],
        'image': item.get('image'),
        'category': item.get('category'),
        'category_label': item.get('category_label'),
        'listing_id': match.get('listing_id'),
        'listing_price_usd': match['listing_price_usd'],
        'reference_price_usd': match['reference_price_usd'],
        'reference_source': match.get('reference_source'),
        'drop_percent': match['drop_percent'],
        'savings_usd': match['savings_usd'],
        'steam_url': match['steam_url'],
        'source': 'steam',
    }


def _scan_single_hash(item, min_drop_percent, category_query):
    """Una sola variante: página por hash si no hay grupo."""
    market_hash_name = item['market_hash_name']
    base, _wear = split_hash_name(market_hash_name)

    group_id = fetch_bucket_group_id(market_hash_name)
    listings = []
    if group_id:
        listings = fetch_listings_for_group(group_id, base_name=base)
        listings = [
            l
            for l in listings
            if l.get('market_hash_name') == market_hash_name
            or (
                l.get('exterior')
                and base
                and f"{base} ({l['exterior']})" == market_hash_name
            )
        ]

    if not listings:
        ref_data = fetch_reference_price(market_hash_name) or {}
        ref = ref_data.get('reference_usd')
        if not ref:
            return []
        lowest = ref_data.get('lowest_usd') or ref
        drop = calc_drop_percent(ref, lowest)
        if drop is None or drop < min_drop_percent:
            return []
        url = (
            steam_listing_url(group_id, category_query=category_query)
            if group_id
            else steam_hash_listing_url(market_hash_name)
        )
        return [
            {
                'market_hash_name': market_hash_name,
                'listing_id': None,
                'listing_price_usd': lowest,
                'reference_price_usd': ref,
                'reference_source': 'steam_lowest',
                'drop_percent': drop,
                'savings_usd': round(ref - lowest, 2),
                'steam_url': url,
                'steam_group_id': group_id,
            }
        ]

    reference, ref_source = reference_with_listing_fallback(
        market_hash_name, listings
    )
    if not reference:
        return []

    matches = []
    gid = group_id or fetch_bucket_group_id(market_hash_name)
    for listing in listings:
        price = listing.get('price_usd')
        drop = calc_drop_percent(reference, price)
        if drop is None or drop < min_drop_percent:
            continue
        listing_id = listing.get('listing_id')
        if gid and listing_id:
            url = steam_listing_url(
                gid, listing_id=listing_id, category_query=category_query
            )
        else:
            url = steam_hash_listing_url(market_hash_name, listing_id=listing_id)

        matches.append(
            {
                'market_hash_name': market_hash_name,
                'listing_id': listing_id,
                'listing_price_usd': price,
                'reference_price_usd': reference,
                'reference_source': ref_source,
                'drop_percent': drop,
                'savings_usd': round(reference - price, 2),
                'steam_url': url,
                'steam_group_id': gid,
            }
        )
    return matches


def run_search(
    plan_slug,
    min_drop_percent,
    search_mode,
    categories,
    weapons,
    exterior='all',
    rarity='all',
    group_offset=0,
):
    errors, limits = validate_search_request(plan_slug, search_mode, categories, weapons)
    if errors:
        return {'errors': errors}

    try:
        min_drop = float(min_drop_percent)
    except (TypeError, ValueError):
        return {'errors': ['Indica un porcentaje de bajada válido']}

    if min_drop < 1 or min_drop > 99:
        return {'errors': ['El porcentaje debe estar entre 1 y 99']}

    items = resolve_items_to_scan(
        search_mode,
        categories,
        weapons,
        limits,
        exterior=exterior,
        rarity=rarity,
    )
    if not items:
        return {
            'matches': [],
            'scanned': 0,
            'groups_scanned': 0,
            'min_drop_percent': min_drop,
            'errors': [],
            'source': 'steam',
        }

    catalog_by_hash = {i['market_hash_name']: i for i in items}
    groups = _group_items_by_skin(items)
    group_keys = sorted(groups.keys())
    max_groups = limits['max_scan']
    offset = int(group_offset or 0) % max(len(group_keys), 1)
    selected_keys = group_keys[offset : offset + max_groups]
    if len(selected_keys) < max_groups and offset > 0:
        selected_keys += group_keys[: max_groups - len(selected_keys)]

    category_query = _category_query_for_items(items)
    raw_matches = []
    groups_scanned = 0

    for base_name in selected_keys:
        group_items = groups[base_name]
        target_hashes = {i['market_hash_name'] for i in group_items}
        groups_scanned += 1

        if len(group_items) == 1:
            raw_matches.extend(
                _scan_single_hash(
                    group_items[0], min_drop, category_query
                )
            )
            continue

        raw_matches.extend(
            scan_item_group(
                base_name,
                target_hashes,
                min_drop,
                category_query=category_query,
            )
        )

    seen = set()
    matches = []
    for m in raw_matches:
        key = (m['market_hash_name'], m.get('listing_id'), m['listing_price_usd'])
        if key in seen:
            continue
        seen.add(key)
        matches.append(_enrich_match(m, catalog_by_hash))

    matches.sort(key=lambda x: (-x['drop_percent'], x['listing_price_usd']))

    return {
        'matches': matches[:80],
        'scanned': len(items),
        'groups_scanned': groups_scanned,
        'groups_total': len(group_keys),
        'group_offset': offset,
        'min_drop_percent': min_drop,
        'errors': [],
        'source': 'steam',
    }
