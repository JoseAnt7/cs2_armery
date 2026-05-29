from extensions import db
from datetime import datetime
import json

# Primer administrador: no se puede quitar el rol admin vía panel (ID fijo).
PRIMARY_ADMIN_USER_ID = 1


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subscriptions = db.relationship(
        'UserSubscription',
        backref='user',
        lazy=True,
        cascade='all, delete-orphan',
    )

    def is_primary_admin(self):
        return self.id == PRIMARY_ADMIN_USER_ID

    def to_dict(self, include_admin=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_admin:
            data['is_admin'] = bool(getattr(self, 'is_admin', False))
            data['admin_protected'] = self.is_primary_admin()
        return data


class Subscription(db.Model):
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    tagline = db.Column(db.String(255))
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    plans = db.relationship(
        'SubscriptionPlan',
        backref='subscription',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='SubscriptionPlan.sort_order',
    )

    def to_dict(self, include_plans=False):
        data = {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'tagline': self.tagline,
            'description': self.description,
            'image_url': self.image_url,
            'is_active': self.is_active,
        }
        if include_plans:
            data['plans'] = [plan.to_dict() for plan in self.plans]
        return data


class SubscriptionPlan(db.Model):
    __tablename__ = 'subscription_plans'

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False)
    slug = db.Column(db.String(40), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(255), nullable=False)
    price_eur = db.Column(db.Numeric(10, 2), nullable=False)
    sort_order = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'slug': self.slug,
            'name': self.name,
            'description': self.description,
            'price_eur': float(self.price_eur),
            'is_featured': self.is_featured,
        }


class UserSubscription(db.Model):
    """Plan contratado por un usuario."""
    __tablename__ = 'user_subscriptions'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'subscription_id', name='uq_user_subscription'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False)
    plan_id = db.Column(db.Integer, db.ForeignKey('subscription_plans.id'), nullable=False)
    subscribed_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    subscription = db.relationship('Subscription')
    plan = db.relationship('SubscriptionPlan')

    def to_dict(self):
        return {
            'id': self.id,
            'subscribed_at': self.subscribed_at.isoformat() if self.subscribed_at else None,
            'is_active': self.is_active,
            'subscription': self.subscription.to_dict() if self.subscription else None,
            'plan': self.plan.to_dict() if self.plan else None,
        }


class PageVisit(db.Model):
    """Registro de visitas a la web (una fila por evento de tracking)."""
    __tablename__ = 'page_visits'

    id = db.Column(db.Integer, primary_key=True)
    visited_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    path = db.Column(db.String(255), default='/')

    def to_dict(self):
        return {
            'id': self.id,
            'visited_at': self.visited_at.isoformat() if self.visited_at else None,
            'path': self.path,
        }


class CSBotSettings(db.Model):
    """Preferencias guardadas del bot CSBot por usuario."""
    __tablename__ = 'csbot_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    settings_json = db.Column(db.Text, default='{}')
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_settings(self):
        try:
            return json.loads(self.settings_json or '{}')
        except json.JSONDecodeError:
            return {}

    def set_settings(self, data):
        self.settings_json = json.dumps(data)
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            'settings': self.get_settings(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ContactMessage(db.Model):
    """Mensajes del formulario de contacto."""
    __tablename__ = 'contact_messages'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    topic = db.Column(db.String(40), nullable=False, default='general')
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    is_read = db.Column(db.Boolean, default=False, nullable=False)


class SiteSettings(db.Model):
    """Ajustes globales de la aplicación (feature flags)."""
    __tablename__ = 'site_settings'

    id = db.Column(db.Integer, primary_key=True)
    hide_subscriptions_public = db.Column(db.Boolean, default=False, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @staticmethod
    def get_singleton():
        row = db.session.get(SiteSettings, 1)
        if row:
            return row
        row = SiteSettings(id=1, hide_subscriptions_public=False)
        db.session.add(row)
        db.session.commit()
        return row

    def to_public_dict(self):
        return {
            'hide_subscriptions_public': bool(self.hide_subscriptions_public),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
