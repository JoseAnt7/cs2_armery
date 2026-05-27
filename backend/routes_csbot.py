"""
API del bot CSBot (solo usuarios con suscripción activa).
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Subscription, UserSubscription, CSBotSettings
from services import catalog
from services.csbot import get_plan_limits, run_search

csbot_bp = Blueprint('csbot', __name__)

CSBOT_SLUG = 'csbot'


def _current_user_id():
    return int(get_jwt_identity())


def _get_active_csbot(user_id):
    return (
        UserSubscription.query.join(Subscription)
        .filter(
            UserSubscription.user_id == user_id,
            UserSubscription.is_active.is_(True),
            Subscription.slug == CSBOT_SLUG,
        )
        .first()
    )


@csbot_bp.route('/api/csbot/status', methods=['GET'])
@jwt_required()
def csbot_status():
    user_sub = _get_active_csbot(_current_user_id())
    if not user_sub:
        return jsonify({'active': False})

    plan = user_sub.plan
    return jsonify({
        'active': True,
        'plan': plan.to_dict() if plan else None,
        'limits': get_plan_limits(plan.slug if plan else 'basic'),
        'subscription': user_sub.subscription.to_dict() if user_sub.subscription else None,
    })


@csbot_bp.route('/api/csbot/settings', methods=['GET'])
@jwt_required()
def get_csbot_settings():
    user_id = _current_user_id()
    if not _get_active_csbot(user_id):
        return jsonify({'msg': 'No tienes CSBot activo'}), 403

    row = CSBotSettings.query.filter_by(user_id=user_id).first()
    if not row:
        return jsonify({'settings': {}})
    return jsonify(row.to_dict())


@csbot_bp.route('/api/csbot/settings', methods=['PUT'])
@jwt_required()
def save_csbot_settings():
    user_id = _current_user_id()
    if not _get_active_csbot(user_id):
        return jsonify({'msg': 'No tienes CSBot activo'}), 403

    data = request.get_json() or {}
    row = CSBotSettings.query.filter_by(user_id=user_id).first()
    if not row:
        row = CSBotSettings(user_id=user_id)
        db.session.add(row)

    row.set_settings(data)
    db.session.commit()
    return jsonify({'msg': 'Ajustes guardados', **row.to_dict()})


@csbot_bp.route('/api/csbot/categories', methods=['GET'])
@jwt_required()
def csbot_categories():
    if not _get_active_csbot(_current_user_id()):
        return jsonify({'msg': 'No tienes CSBot activo'}), 403
    return jsonify({'categories': catalog.get_categories()})


@csbot_bp.route('/api/csbot/search', methods=['POST'])
@jwt_required()
def csbot_search():
    user_id = _current_user_id()
    user_sub = _get_active_csbot(user_id)
    if not user_sub:
        return jsonify({'msg': 'No tienes CSBot activo'}), 403

    data = request.get_json() or {}
    plan_slug = user_sub.plan.slug

    result = run_search(
        plan_slug=plan_slug,
        min_drop_percent=data.get('min_drop_percent', 30),
        search_mode=data.get('search_mode', 'categories'),
        categories=data.get('categories', []),
        weapons=data.get('weapons', []),
        exterior=data.get('exterior', 'all'),
        rarity=data.get('rarity', 'all'),
        group_offset=data.get('group_offset', 0),
    )

    if result.get('errors'):
        return jsonify({'errors': result['errors']}), 400

    return jsonify(result)
