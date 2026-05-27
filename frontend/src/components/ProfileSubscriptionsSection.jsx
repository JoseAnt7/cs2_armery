import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUserSubscriptions } from '../api/client';
import '../styles/subscriptions.css';

function formatPrice(eur) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(eur);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ProfileSubscriptionsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserSubscriptions()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="profile-section__title">Subscripciones</h2>
      <p className="profile-section__desc">Tus planes activos en SkinAtlas</p>

      {loading && <p className="profile-section__desc">Cargando…</p>}

      {error && (
        <p className="profile-message profile-message--error">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="profile-placeholder">
          <p>Aún no tienes ninguna suscripción activa.</p>
          <Link to="/suscripciones" className="profile-guard__link" style={{ marginTop: '1rem' }}>
            Ver planes disponibles
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="user-subs-list">
          {items.map((item) => (
            <li key={item.id} className="user-sub-card">
              {item.subscription?.image_url && (
                <img
                  className="user-sub-card__img"
                  src={item.subscription.image_url}
                  alt=""
                />
              )}
              <div className="user-sub-card__body">
                <h3 className="user-sub-card__product">{item.subscription?.name}</h3>
                <p className="user-sub-card__plan">
                  Plan <strong>{item.plan?.name}</strong>
                  {' · '}
                  {formatPrice(item.plan?.price_eur)}
                  <span className="user-sub-card__period">/mes</span>
                </p>
                <p className="user-sub-card__desc">{item.plan?.description}</p>
                <p className="user-sub-card__date">
                  Activo desde {formatDate(item.subscribed_at)}
                </p>
              </div>
              <Link
                to={`/suscripciones/${item.subscription?.slug}`}
                className="user-sub-card__link"
              >
                Gestionar
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/suscripciones" className="profile-subs-more">
        Explorar más suscripciones →
      </Link>
    </section>
  );
}
