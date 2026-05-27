"""
Datos iniciales de suscripciones (CSBot y planes).
"""

CSBOT_IMAGE = (
    'https://images.unsplash.com/photo-1677442136019-21780ecad995'
    '?auto=format&fit=crop&w=800&q=80'
)

CSBOT_DESCRIPTION = """CSBot es un bot especializado que te avisará cuando bajen de precio las armas y accesorios que elijas. Configura tus alertas con total flexibilidad:

1. Porcentaje de bajada respecto al precio actual
Elige un umbral mínimo (por ejemplo, 30 %) y recibirás avisos de todas las skins que hayan bajado ese porcentaje o más hacia arriba.

2. Arma o categoría concreta
Selecciona un modelo específico, una categoría entera (subfusiles, rifles, cuchillos, guantes…) o cualquier combinación que necesites. Todo es posible."""

CSBOT_PLANS = [
    {
        'slug': 'basic',
        'name': 'Basic',
        'description': 'Avisos de hasta 20 armas y accesorios que selecciones',
        'price_eur': 15.00,
        'sort_order': 1,
        'is_featured': False,
    },
    {
        'slug': 'advanced',
        'name': 'Advanced',
        'description': 'Avisos ilimitados en 3 categorías de armas y accesorios que elijas',
        'price_eur': 30.00,
        'sort_order': 2,
        'is_featured': True,
    },
    {
        'slug': '2pro',
        'name': '2Pro',
        'description': 'Para avanzados: avisos en todas las categorías, armas y accesorios',
        'price_eur': 50.00,
        'sort_order': 3,
        'is_featured': False,
    },
]


def seed_subscriptions():
    from extensions import db
    from models import Subscription, SubscriptionPlan

    if Subscription.query.filter_by(slug='csbot').first():
        return

    csbot = Subscription(
        slug='csbot',
        name='CSBot',
        tagline='Alertas inteligentes de precios en CS2',
        description=CSBOT_DESCRIPTION,
        image_url=CSBOT_IMAGE,
        is_active=True,
    )
    db.session.add(csbot)
    db.session.flush()

    for plan_data in CSBOT_PLANS:
        db.session.add(SubscriptionPlan(subscription_id=csbot.id, **plan_data))

    db.session.commit()
