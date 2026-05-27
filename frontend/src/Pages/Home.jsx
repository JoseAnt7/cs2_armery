import { useCallback, useEffect, useState } from 'react';
import { fetchCategories, fetchWeaponFilters, fetchWeapons } from '../api/client';
import { AdSlot } from '../components/AdSlot';
import { FilterBar } from '../components/FilterBar';
import { WeaponCard } from '../components/WeaponCard';
import '../styles/catalog.css';
import '../styles/ads.css';

const DEFAULT_CATEGORIES = [{ id: 'all', label: 'Todas' }];

export function Home() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [exterior, setExterior] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [exteriorOptions, setExteriorOptions] = useState([]);
  const [rarityOptions, setRarityOptions] = useState([]);
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {});

    fetchWeaponFilters()
      .then((res) => {
        setExteriorOptions(res.exteriors || []);
        setRarityOptions(res.rarities || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [category, debouncedSearch, exterior, rarity, sort]);

  const loadWeapons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeapons({
        category,
        q: debouncedSearch,
        exterior,
        rarity,
        page,
        limit: 24,
        sort,
        prices: true,
      });
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, exterior, rarity, page, sort]);

  useEffect(() => {
    loadWeapons();
  }, [loadWeapons]);

  return (
    <div className="home-page">
      <aside className="home-page__ads home-page__ads--left">
        <AdSlot slot="home-left-top" size="medium" />
        <AdSlot slot="home-left-bottom" size="tall" />
      </aside>

      <div className="home-page__content">
      <section className="hero">
        <h1 className="hero__title">
          Compara precios de <span>skins CS2</span>
        </h1>
        <p className="hero__subtitle">
          Encuentra dónde comprar más barato entre Steam, Skinport, DMarket, Waxpeer y más mercados en un solo lugar.
        </p>
      </section>

      <FilterBar
        categories={categories}
        activeCategory={category}
        onCategoryChange={setCategory}
        searchQuery={search}
        onSearchChange={setSearch}
        exterior={exterior}
        onExteriorChange={setExterior}
        rarity={rarity}
        onRarityChange={setRarity}
        exteriorOptions={exteriorOptions}
        rarityOptions={rarityOptions}
        sort={sort}
        onSortChange={setSort}
      />

      {data && (
        <div className="results-meta">
          <span>
            {data.total.toLocaleString()} skins encontradas
          </span>
          <span>
            Página {data.page} de {data.pages}
          </span>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Cargando catálogo y precios...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>No se pudo cargar el catálogo: {error}</p>
          <p>Comprueba que el backend Flask esté en ejecución (puerto 5000).</p>
        </div>
      )}

      {!loading && !error && data?.items?.length === 0 && (
        <div className="empty-state">
          <p>No hay resultados para tu búsqueda.</p>
        </div>
      )}

      {!loading && !error && data?.items?.length > 0 && (
        <>
          <div className="weapon-grid">
            {data.items.map((weapon) => (
              <WeaponCard key={weapon.id} weapon={weapon} />
            ))}
          </div>

          <nav className="pagination" aria-label="Paginación">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Anterior
            </button>
            <span className="pagination__info">
              {page} / {data.pages}
            </span>
            <button
              type="button"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente →
            </button>
          </nav>
        </>
      )}
      </div>

      <aside className="home-page__ads home-page__ads--right">
        <AdSlot slot="home-right-top" size="medium" />
        <AdSlot slot="home-right-bottom" size="tall" />
      </aside>
    </div>
  );
}
