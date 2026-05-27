import '../styles/detail.css';

function formatPrice(usd) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(usd);
}

export function PriceOffers({ pricing }) {
  const offers = pricing?.top_cheapest ?? [];

  if (!offers.length) {
    return (
      <div className="offers-panel">
        <h2 className="offers-panel__title">Mejores ofertas</h2>
        <p className="offers-panel__subtitle">
          No encontramos precios en este momento. Steam puede limitar peticiones; inténtalo de nuevo en unos minutos.
        </p>
        <div className="no-offers">Sin datos de mercado disponibles</div>
      </div>
    );
  }

  return (
    <div className="offers-panel">
      <h2 className="offers-panel__title">Top 5 más baratos</h2>
      <p className="offers-panel__subtitle">
        Ordenados de menor a mayor precio en USD · {pricing.sources_count} fuentes consultadas
      </p>
      <ul className="offer-list">
        {offers.map((offer, index) => (
          <li
            key={offer.marketplace_id}
            className={`offer-row ${index === 0 ? 'offer-row--best' : ''}`}
          >
            <span className="offer-row__rank">{index + 1}</span>
            <div className="offer-row__market">
              <div className="offer-row__market-name">
                <span aria-hidden>{offer.logo}</span>
                {offer.marketplace_name}
              </div>
              {offer.note && <div className="offer-row__note">{offer.note}</div>}
            </div>
            <span className="offer-row__price">{formatPrice(offer.price_usd)}</span>
            <a
              className="offer-row__cta"
              href={offer.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Comprar
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
