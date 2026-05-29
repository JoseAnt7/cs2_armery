import { useEffect, useState } from 'react';
import { fetchSubscriptions } from '../api/client';
import { SubscriptionCard } from '../components/SubscriptionCard';
import '../styles/catalog.css';
import '../styles/subscriptions.css';

export function Subscriptions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptions()
      .then((data) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <h1 className="hero__title">
          Suscripciones <span>Global Skin Metrics</span>
        </h1>
        <p className="hero__subtitle">
          Herramientas premium para traders: alertas de precio, bots inteligentes y mucho más.
        </p>
      </section>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Cargando suscripciones…</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>No se pudieron cargar las suscripciones: {error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p>No hay suscripciones disponibles en este momento.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="subscriptions-grid">
          {items.map((sub) => (
            <SubscriptionCard key={sub.slug} subscription={sub} />
          ))}
        </div>
      )}
    </>
  );
}
