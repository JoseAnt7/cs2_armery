import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchWeaponDetail } from '../api/client';
import { PriceOffers } from '../components/PriceOffers';
import { Seo } from '../components/Seo';
import '../styles/detail.css';

function formatPrice(usd) {
  if (usd == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(usd);
}

export function WeaponDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWeaponDetail(id)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="detail-hero" style={{ minHeight: 320 }} />
        <div className="offers-panel" style={{ minHeight: 280, marginTop: 24 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error-state">
        <p>{error || 'Arma no encontrada'}</p>
        <Link to="/" className="back-link">
          ← Volver al catálogo
        </Link>
      </div>
    );
  }

  const { weapon, pricing } = data;
  const priceHint =
    pricing?.average_price_usd != null
      ? ` Precio medio aproximado: ${formatPrice(pricing.average_price_usd)}.`
      : '';
  const seoDescription = `Compara precios de ${weapon.display_name} en CS2: ofertas en Steam, Skinport, DMarket y más mercados.${priceHint}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: weapon.display_name,
    description: seoDescription,
    image: weapon.image || undefined,
    category: weapon.category_label,
  };

  return (
    <>
      <Seo
        title={`${weapon.display_name} — precio CS2`}
        description={seoDescription}
        canonicalPath={`/arma/${id}`}
        jsonLdExtra={productJsonLd}
      />
      <Link to="/" className="back-link">
        ← Volver al catálogo
      </Link>

      <div className="detail-layout">
        <article className="detail-hero">
          <div className="detail-hero__image">
            {weapon.image && (
              <img src={weapon.image} alt={weapon.display_name} />
            )}
          </div>
          <div
            className="detail-hero__rarity-bar"
            style={{ background: weapon.rarity_color }}
          />
          <div className="detail-hero__info">
            <p className="detail-hero__category">{weapon.category_label}</p>
            <h1 className="detail-hero__title">{weapon.display_name}</h1>
            <div className="detail-hero__tags">
              {weapon.rarity && <span className="tag">{weapon.rarity}</span>}
              {weapon.weapon && <span className="tag">{weapon.weapon}</span>}
              {weapon.stattrak && <span className="tag">StatTrak™</span>}
            </div>

            <div className="average-price-box">
              <div className="average-price-box__label">Precio promedio</div>
              <div className="average-price-box__value">
                {formatPrice(pricing.average_price_usd)}
              </div>
              <p className="average-price-box__hint">
                Media de {pricing.sources_count} mercado
                {pricing.sources_count !== 1 ? 's' : ''} con precio disponible
              </p>
            </div>
          </div>
        </article>

        <PriceOffers pricing={pricing} />
      </div>
    </>
  );
}
