import { RaritySelect } from './RaritySelect';
import '../styles/catalog.css';

export function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  exterior,
  onExteriorChange,
  rarity,
  onRarityChange,
  exteriorOptions,
  rarityOptions,
  sort,
  onSortChange,
}) {
  return (
    <div className="filters-bar">
      <div className="search-box">
        <span className="search-box__icon" aria-hidden>
          🔍
        </span>
        <input
          type="search"
          placeholder="Buscar skin, arma o patrón..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Buscar armas"
        />
      </div>

      <div className="category-pills" role="tablist" aria-label="Categorías">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.id}
            className={`pill ${activeCategory === cat.id ? 'pill--active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="filters-extra">
        <select
          className="sort-select"
          value={exterior}
          onChange={(e) => onExteriorChange(e.target.value)}
          aria-label="Filtrar por desgaste"
        >
          <option value="all">Todos los desgastes</option>
          {exteriorOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <RaritySelect
          value={rarity}
          onChange={onRarityChange}
          options={rarityOptions}
          aria-label="Filtrar por rareza"
        />

        <select
          className="sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Ordenar resultados"
        >
          <option value="name">Nombre A-Z</option>
          <option value="rarity">Rareza</option>
        </select>
      </div>
    </div>
  );
}
