import { useEffect, useRef, useState } from 'react';
import { getRarityColor, normalizeRarityOptions } from '../constants/rarityColors';
import '../styles/rarity-select.css';

export function RaritySelect({
  value,
  onChange,
  options = [],
  disabled = false,
  className = '',
  id,
  'aria-label': ariaLabel = 'Filtrar por rareza',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const normalized = normalizeRarityOptions(options);

  const selectedLabel =
    value === 'all' ? 'Todas las rarezas' : value;
  const selectedColor = value === 'all' ? null : getRarityColor(value);

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function pick(next) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`rarity-select ${className} ${disabled ? 'rarity-select--disabled' : ''}`.trim()}
    >
      <button
        type="button"
        id={id}
        className="rarity-select__trigger sort-select"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {selectedColor && (
          <span
            className="rarity-select__swatch"
            style={{ background: selectedColor }}
            aria-hidden
          />
        )}
        <span className="rarity-select__label">{selectedLabel}</span>
        <span className="rarity-select__chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul className="rarity-select__menu" role="listbox" aria-label={ariaLabel}>
          <li role="option" aria-selected={value === 'all'}>
            <button type="button" className="rarity-select__option" onClick={() => pick('all')}>
              <span className="rarity-select__swatch rarity-select__swatch--empty" aria-hidden />
              <span>Todas las rarezas</span>
            </button>
          </li>
          {normalized.map((opt) => (
            <li key={opt.name} role="option" aria-selected={value === opt.name}>
              <button
                type="button"
                className={`rarity-select__option ${value === opt.name ? 'rarity-select__option--active' : ''}`}
                onClick={() => pick(opt.name)}
              >
                <span
                  className="rarity-select__swatch"
                  style={{ background: opt.color }}
                  aria-hidden
                />
                <span>{opt.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
