import { Link } from 'react-router-dom';
import '../styles/subscriptions.css';

export function SubscriptionCard({ subscription }) {
  return (
    <Link to={`/suscripciones/${subscription.slug}`} className="subscription-card">
      <div className="subscription-card__image-wrap">
        {subscription.image_url && (
          <img
            className="subscription-card__image"
            src={subscription.image_url}
            alt={subscription.name}
            loading="lazy"
          />
        )}
        <span className="subscription-card__badge">Bot</span>
      </div>
      <div className="subscription-card__body">
        <h3 className="subscription-card__name">{subscription.name}</h3>
        {subscription.tagline && (
          <p className="subscription-card__tagline">{subscription.tagline}</p>
        )}
        <span className="subscription-card__cta">Ver planes →</span>
      </div>
    </Link>
  );
}
