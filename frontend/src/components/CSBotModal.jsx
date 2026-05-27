import { useEffect, useMemo, useState } from 'react';

import { fetchWeaponFilters, fetchWeapons } from '../api/client';
import { RaritySelect } from './RaritySelect';

import { useCSBot } from '../context/CSBotContext';

import '../styles/csbot.css';



const CATEGORY_OPTIONS = [
  { id: 'rifles', label: 'Rifles' },
  { id: 'pistols', label: 'Pistolas' },
  { id: 'smgs', label: 'SMGs' },
  { id: 'heavy', label: 'Pesadas' },
  { id: 'snipers', label: 'Francotiradores' },
  { id: 'knives', label: 'Cuchillos' },
  { id: 'gloves', label: 'Guantes' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'cases', label: 'Cajas' },
  { id: 'agents', label: 'Agents' },
];

const EXTERIOR_OPTIONS = [
  'Factory New',
  'Minimal Wear',
  'Field-Tested',
  'Well-Worn',
  'Battle-Scarred',
];

const RARITY_OPTIONS = [
  'Consumer Grade',
  'Industrial Grade',
  'Mil-Spec Grade',
  'Restricted',
  'Classified',
  'Covert',
  'Contraband',
  'Extraordinary',
];

const DURATION_OPTIONS = [

  { value: 5, label: '5 min' },

  { value: 15, label: '15 min' },

  { value: 30, label: '30 min' },

  { value: 60, label: '1 h' },

];



function formatRemaining(ms) {

  if (ms <= 0) return '0:00';

  const totalSec = Math.ceil(ms / 1000);

  const m = Math.floor(totalSec / 60);

  const s = totalSec % 60;

  return `${m}:${s.toString().padStart(2, '0')}`;

}



export function CSBotModal({ open, onClose }) {

  const {

    plan,

    limits,

    settings,

    setSettings,

    monitoring,

    monitorEndsAt,

    monitorResults,

    monitorError,

    monitorBusy,

    monitorTick,

    startMonitoring,

    stopMonitoring,

  } = useCSBot();



  const [minDrop, setMinDrop] = useState(settings.min_drop_percent ?? 30);

  const [searchMode, setSearchMode] = useState(settings.search_mode ?? 'categories');

  const [categories, setCategories] = useState(settings.categories ?? []);

  const [weapons, setWeapons] = useState(settings.weapons ?? []);
  const [exterior, setExterior] = useState(settings.exterior ?? 'all');
  const [rarity, setRarity] = useState(settings.rarity ?? 'all');

  const [durationMin, setDurationMin] = useState(settings.monitor_duration_minutes ?? 15);

  const [weaponQuery, setWeaponQuery] = useState('');

  const [suggestions, setSuggestions] = useState([]);

  const [error, setError] = useState('');
  const [rarityOptions, setRarityOptions] = useState(RARITY_OPTIONS);
  const [now, setNow] = useState(Date.now());



  useEffect(() => {

    if (!open) return;

    setMinDrop(settings.min_drop_percent ?? 30);

    setSearchMode(settings.search_mode ?? (limits?.allow_all ? 'all' : 'categories'));

    setCategories(settings.categories ?? []);

    setWeapons(settings.weapons ?? []);
    setExterior(settings.exterior ?? 'all');
    setRarity(settings.rarity ?? 'all');

    setDurationMin(settings.monitor_duration_minutes ?? 15);

    setError('');

  }, [open, settings, limits]);

  useEffect(() => {
    if (!open) return;
    fetchWeaponFilters()
      .then((res) => {
        if (res.rarities?.length) setRarityOptions(res.rarities);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {

    if (!monitoring) return undefined;

    const t = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(t);

  }, [monitoring]);



  useEffect(() => {

    if (!weaponQuery.trim() || weaponQuery.length < 2) {

      setSuggestions([]);

      return;

    }

    const timer = setTimeout(() => {

      fetchWeapons({ q: weaponQuery, limit: 8, prices: false })

        .then((data) => setSuggestions(data.items))

        .catch(() => setSuggestions([]));

    }, 300);

    return () => clearTimeout(timer);

  }, [weaponQuery]);



  const remainingMs = monitorEndsAt ? monitorEndsAt - now : 0;

  const displayResults = monitorResults;



  const resultCount = useMemo(

    () => displayResults?.matches?.length ?? 0,

    [displayResults, monitorTick],

  );



  function toggleCategory(id) {

    setCategories((prev) => {

      if (prev.includes(id)) return prev.filter((c) => c !== id);

      if (prev.length >= (limits?.max_categories ?? 1)) return prev;

      return [...prev, id];

    });

  }



  function addWeapon(item) {

    const name = item.market_hash_name;

    if (weapons.includes(name)) return;

    if (weapons.length >= (limits?.max_weapons ?? 20)) return;

    setWeapons((prev) => [...prev, name]);

    setWeaponQuery('');

    setSuggestions([]);

  }



  function removeWeapon(name) {

    setWeapons((prev) => prev.filter((w) => w !== name));

  }



  function buildPayload() {

    return {

      min_drop_percent: minDrop,

      search_mode: searchMode,

      categories,

      weapons,
      exterior,
      rarity,

      monitor_duration_minutes: durationMin,

    };

  }



  async function handleStart(event) {

    event.preventDefault();

    setError('');

    const payload = buildPayload();

    setSettings(payload);



    try {

      await startMonitoring(payload, durationMin);

    } catch (err) {

      setError(err.message);

    }

  }



  function handleStop() {

    stopMonitoring();

  }



  if (!open) return null;



  return (

    <div className="csbot-overlay" onClick={onClose} role="presentation">

      <div

        className="csbot-modal"

        onClick={(e) => e.stopPropagation()}

        role="dialog"

        aria-labelledby="csbot-title"

      >

        <header className="csbot-modal__header">

          <div>

            <h2 id="csbot-title" className="csbot-modal__title">

              CSBot

            </h2>

            <p className="csbot-modal__plan">

              Plan {plan?.name} · Solo Steam Community Market

            </p>

          </div>

          <button type="button" className="csbot-modal__close" onClick={onClose} aria-label="Cerrar">

            ✕

          </button>

        </header>



        {monitoring && (

          <div className="csbot-monitor-bar" role="status">

            <span className="csbot-monitor-bar__dot" aria-hidden />

            <span>

              Búsqueda activa · quedan {formatRemaining(remainingMs)}

              {monitorBusy ? ' · escaneando Steam…' : ''}

            </span>

            <button type="button" className="csbot-monitor-bar__stop" onClick={handleStop}>

              Detener

            </button>

          </div>

        )}



        <form className="csbot-form" onSubmit={handleStart}>

          <div className="csbot-field">

            <label htmlFor="csbot-drop">Descuento mínimo respecto al precio de referencia (%)</label>

            <div className="csbot-drop-row">

              <input

                id="csbot-drop"

                type="range"

                min="5"

                max="95"

                value={minDrop}

                onChange={(e) => setMinDrop(Number(e.target.value))}

                disabled={monitoring}

              />

              <span className="csbot-drop-value">{minDrop}%</span>

            </div>

            <p className="csbot-hint">

              Compara cada oferta de Steam con la mediana de ventas (o el precio habitual si no hay

              mediana). Si alguien lista un 60% o más por debajo, aparecerá aquí.

            </p>

          </div>



          <div className="csbot-field">
            <span className="csbot-label">Filtros de calidad</span>
            <div className="csbot-filter-grid">
              <select
                className="csbot-select"
                value={exterior}
                onChange={(e) => setExterior(e.target.value)}
                disabled={monitoring}
              >
                <option value="all">Todos los desgastes</option>
                {EXTERIOR_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <RaritySelect
                className="csbot-select-wrap"
                value={rarity}
                onChange={setRarity}
                options={rarityOptions}
                disabled={monitoring}
                aria-label="Filtrar por rareza"
              />
            </div>
          </div>



          <div className="csbot-field">

            <label htmlFor="csbot-duration">Duración de la búsqueda activa</label>

            <select

              id="csbot-duration"

              value={durationMin}

              onChange={(e) => setDurationMin(Number(e.target.value))}

              disabled={monitoring}

              className="csbot-select"

            >

              {DURATION_OPTIONS.map((opt) => (

                <option key={opt.value} value={opt.value}>

                  {opt.label}

                </option>

              ))}

            </select>

            <p className="csbot-hint">

              Mientras dure, el bot revisará el mercado de Steam cada ~50 s según tus filtros.

            </p>

          </div>



          <div className="csbot-field">

            <span className="csbot-label">Ámbito de búsqueda</span>

            <div className="csbot-mode-tabs">

              {limits?.allow_all && (

                <button

                  type="button"

                  className={`csbot-mode-tab ${searchMode === 'all' ? 'csbot-mode-tab--active' : ''}`}

                  onClick={() => setSearchMode('all')}

                  disabled={monitoring}

                >

                  Todo el catálogo

                </button>

              )}

              <button

                type="button"

                className={`csbot-mode-tab ${searchMode === 'categories' ? 'csbot-mode-tab--active' : ''}`}

                onClick={() => setSearchMode('categories')}

                disabled={monitoring}

              >

                Por categorías

                {limits?.max_categories < 99 && ` (máx. ${limits.max_categories})`}

              </button>

              <button

                type="button"

                className={`csbot-mode-tab ${searchMode === 'weapons' ? 'csbot-mode-tab--active' : ''}`}

                onClick={() => setSearchMode('weapons')}

                disabled={monitoring}

              >

                Armas concretas

                {limits?.max_weapons <= 20 && ` (máx. ${limits.max_weapons})`}

              </button>

            </div>

          </div>



          {searchMode === 'categories' && (

            <div className="csbot-field">

              <span className="csbot-label">Categorías</span>

              <div className="csbot-chips">

                {CATEGORY_OPTIONS.map((cat) => (

                  <button

                    key={cat.id}

                    type="button"

                    className={`csbot-chip ${categories.includes(cat.id) ? 'csbot-chip--active' : ''}`}

                    onClick={() => toggleCategory(cat.id)}

                    disabled={monitoring}

                  >

                    {cat.label}

                  </button>

                ))}

              </div>

            </div>

          )}



          {searchMode === 'weapons' && (

            <div className="csbot-field">

              <label htmlFor="csbot-weapon-search">Buscar y añadir armas</label>

              <input

                id="csbot-weapon-search"

                type="search"

                placeholder="Ej: AK-47 Fire Serpent, AWP Asiimov…"

                value={weaponQuery}

                onChange={(e) => setWeaponQuery(e.target.value)}

                disabled={monitoring}

              />

              {suggestions.length > 0 && (

                <ul className="csbot-suggestions">

                  {suggestions.map((item) => (

                    <li key={item.id}>

                      <button type="button" onClick={() => addWeapon(item)}>

                        {item.market_hash_name}

                      </button>

                    </li>

                  ))}

                </ul>

              )}

              {weapons.length > 0 && (

                <div className="csbot-selected-weapons">

                  {weapons.map((name) => (

                    <span key={name} className="csbot-weapon-tag">

                      {name}

                      <button

                        type="button"

                        onClick={() => removeWeapon(name)}

                        aria-label="Quitar"

                        disabled={monitoring}

                      >

                        ×

                      </button>

                    </span>

                  ))}

                </div>

              )}

            </div>

          )}



          {(error || monitorError) && <p className="csbot-error">{error || monitorError}</p>}



          {!monitoring ? (

            <button type="submit" className="csbot-search-btn">

              Iniciar búsqueda en Steam

            </button>

          ) : (

            <button type="button" className="csbot-search-btn csbot-search-btn--stop" onClick={handleStop}>

              Detener búsqueda

            </button>

          )}

        </form>



        {displayResults && (

          <section className="csbot-results">

            <h3 className="csbot-results__title">

              {resultCount} ofertas en Steam

              {displayResults.scanned ? ` · ${displayResults.scanned} variantes en filtro` : ''}

            </h3>

            {resultCount === 0 ? (

              <p className="csbot-hint">

                Aún no hay ofertas con al menos {minDrop}% de descuento. El bot sigue revisando Steam.

              </p>

            ) : (

              <ul className="csbot-results__list">

                {displayResults.matches.map((item) => (

                  <li

                    key={`${item.market_hash_name}-${item.listing_id || item.listing_price_usd}`}

                    className="csbot-result-row"

                  >

                    {item.image && (

                      <img src={item.image} alt="" className="csbot-result-row__img" />

                    )}

                    <div className="csbot-result-row__info">

                      <a

                        href={item.steam_url}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="csbot-result-row__name"

                      >

                        {item.market_hash_name}

                      </a>

                      <span className="csbot-result-row__meta">

                        −{item.drop_percent}% · ${item.listing_price_usd} vs ref. $

                        {item.reference_price_usd}

                      </span>

                      <span className="csbot-result-row__link-hint">Abrir en Steam →</span>

                    </div>

                  </li>

                ))}

              </ul>

            )}

          </section>

        )}

      </div>

    </div>

  );

}


