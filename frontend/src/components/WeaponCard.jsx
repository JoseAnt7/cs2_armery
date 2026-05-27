import { Link } from 'react-router-dom';

function formatPrice(usd) {
  if (usd == null) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(usd);
}

export function WeaponCard({ weapon }) {
  const priceLabel = formatPrice(weapon.preview_price_usd);

  return (
    <Link to={`/arma/${weapon.id}`} className="weapon-card">
      <div className="weapon-card__image-wrap">
        {weapon.image ? (
          <img
            className="weapon-card__image"
            src={weapon.image}
            alt={weapon.display_name}
            loading="lazy"
          />
        ) : (
          <span style={{ opacity: 0.3 }}>Sin imagen</span>
        )}
        <div
          className="weapon-card__rarity"
          style={{ background: weapon.rarity_color || '#b0c3d9' }}
        />
      </div>
      <div className="weapon-card__body">
        <h3 className="weapon-card__name">{weapon.display_name}</h3>
        <p className="weapon-card__meta">{weapon.category_label}</p>
        {priceLabel ? (
          <p className="weapon-card__price">desde {priceLabel}</p>
        ) : (
          <p className="weapon-card__price weapon-card__price--muted">Ver precios →</p>
        )}
      </div>
    </Link>
  );
}
