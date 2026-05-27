"""
Rutas API para suscripciones y planes.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Subscription, SubscriptionPlan, UserSubscription

subscriptions_bp = Blueprint('subscriptions', __name__)


def _current_user_id():
    return int(get_jwt_identity())


@subscriptions_bp.route('/api/subscriptions', methods=['GET'])
def list_subscriptions():
    include_plans = request.args.get('include_plans', '0') == '1'
    items = (
        Subscription.query.filter_by(is_active=True)
        .order_by(Subscription.name)
        .all()
    )
    return jsonify({
        'items': [s.to_dict(include_plans=include_plans) for s in items]
    })


@subscriptions_bp.route('/api/subscriptions/<slug>', methods=['GET'])
def subscription_detail(slug):
    sub = Subscription.query.filter_by(slug=slug, is_active=True).first()
    if not sub:
        return jsonify({'error': 'Suscripción no encontrada'}), 404
    return jsonify({'subscription': sub.to_dict(include_plans=True)})


@subscriptions_bp.route('/api/user/subscriptions', methods=['GET'])
@jwt_required()
def list_user_subscriptions():
    user_id = _current_user_id()
    items = (
        UserSubscription.query.filter_by(user_id=user_id, is_active=True)
        .order_by(UserSubscription.subscribed_at.desc())
        .all()
    )
    return jsonify({'items': [item.to_dict() for item in items]})


@subscriptions_bp.route('/api/user/subscriptions', methods=['POST'])
@jwt_required()
def subscribe_user():
    user_id = _current_user_id()
    data = request.get_json() or {}
    subscription_slug = data.get('subscription_slug')
    plan_slug = data.get('plan_slug')

    if not subscription_slug or not plan_slug:
        return jsonify({'msg': 'Faltan subscription_slug o plan_slug'}), 400

    sub = Subscription.query.filter_by(slug=subscription_slug, is_active=True).first()
    if not sub:
        return jsonify({'msg': 'Suscripción no encontrada'}), 404

    plan = SubscriptionPlan.query.filter_by(
        subscription_id=sub.id, slug=plan_slug
    ).first()
    if not plan:
        return jsonify({'msg': 'Plan no encontrado'}), 404

    existing = UserSubscription.query.filter_by(
        user_id=user_id, subscription_id=sub.id
    ).first()

    if existing:
        existing.plan_id = plan.id
        existing.is_active = True
        existing.subscribed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            'msg': 'Plan actualizado',
            'user_subscription': existing.to_dict(),
        })

    user_sub = UserSubscription(
        user_id=user_id,
        subscription_id=sub.id,
        plan_id=plan.id,
    )
    db.session.add(user_sub)
    db.session.commit()

    return jsonify({
        'msg': 'Suscripción activada',
        'user_subscription': user_sub.to_dict(),
    }), 201
