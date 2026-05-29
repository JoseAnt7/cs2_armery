"""Panel de administración (solo usuarios con is_admin)."""
from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash
from sqlalchemy import func

from extensions import db
from models import User, UserSubscription, Subscription, SubscriptionPlan, PageVisit, SiteSettings

admin_bp = Blueprint("admin", __name__)


def _current_user_id():
    return int(get_jwt_identity())


def _get_admin_user():
    user = db.session.get(User, _current_user_id())
    if not user or not user.is_admin:
        return None
    return user


def _start_of_today_utc():
    now = datetime.utcnow()
    return datetime(now.year, now.month, now.day)


def _start_of_month_utc():
    now = datetime.utcnow()
    return datetime(now.year, now.month, 1)


def _start_of_year_utc():
    now = datetime.utcnow()
    return datetime(now.year, 1, 1)


@admin_bp.route("/api/admin/stats", methods=["GET"])
@jwt_required()
def admin_stats():
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    t0_day = _start_of_today_utc()
    t0_month = _start_of_month_utc()
    t0_year = _start_of_year_utc()

    day_count = PageVisit.query.filter(PageVisit.visited_at >= t0_day).count()
    month_count = PageVisit.query.filter(PageVisit.visited_at >= t0_month).count()
    year_count = PageVisit.query.filter(PageVisit.visited_at >= t0_year).count()

    return jsonify({
        "visits": {
            "day": day_count,
            "month": month_count,
            "year": year_count,
            "totals_note": "Basado en eventos de tracking enviados desde el cliente (ver /api/visits).",
        },
        "users_total": User.query.count(),
        "admins_total": User.query.filter_by(is_admin=True).count(),
    })


@admin_bp.route("/api/admin/users", methods=["GET"])
@jwt_required()
def admin_list_users():
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    users = User.query.order_by(User.id.desc()).limit(200).all()
    items = []
    for u in users:
        subs = UserSubscription.query.filter_by(user_id=u.id).order_by(
            UserSubscription.subscribed_at.desc()
        ).all()
        items.append({
            **u.to_dict(include_admin=True),
            "subscriptions": [s.to_dict() for s in subs],
        })
    return jsonify({"items": items})


@admin_bp.route("/api/admin/users", methods=["POST"])
@jwt_required()
def admin_create_user():
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    is_admin = bool(data.get("is_admin"))

    if not username or not email or not password:
        return jsonify({"msg": "username, email y password son obligatorios"}), 400
    if len(password) < 6:
        return jsonify({"msg": "La contraseña debe tener al menos 6 caracteres"}), 400

    if User.query.filter(
        (func.lower(User.username) == username.lower()) | (User.email == email)
    ).first():
        return jsonify({"msg": "Usuario o email ya existe"}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        is_admin=is_admin,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "Usuario creado", "user": user.to_dict(include_admin=True)}), 201


@admin_bp.route("/api/admin/users/<int:user_id>", methods=["PATCH"])
@jwt_required()
def admin_update_user(user_id):
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    actor = db.session.get(User, _current_user_id())
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    data = request.get_json() or {}

    if "is_admin" in data:
        target_admin = bool(data["is_admin"])
        if user.id == actor.id and not target_admin:
            return jsonify({"msg": "No puedes quitarte el rol admin a ti mismo"}), 400
        if not target_admin and user.is_primary_admin():
            return jsonify({
                "msg": "No se puede quitar el rol admin al administrador principal (ID 1)",
            }), 400
        user.is_admin = target_admin

    if "email" in data and data["email"]:
        new_email = data["email"].strip().lower()
        existing = User.query.filter(User.email == new_email, User.id != user.id).first()
        if existing:
            return jsonify({"msg": "Email ya en uso"}), 400
        user.email = new_email

    if "username" in data and data["username"]:
        new_name = data["username"].strip()
        existing = User.query.filter(
            func.lower(User.username) == new_name.lower(), User.id != user.id
        ).first()
        if existing:
            return jsonify({"msg": "Nombre de usuario ya en uso"}), 400
        user.username = new_name

    if data.get("password"):
        if len(data["password"]) < 6:
            return jsonify({"msg": "La contraseña debe tener al menos 6 caracteres"}), 400
        user.password_hash = generate_password_hash(data["password"])

    db.session.commit()
    return jsonify({"msg": "Usuario actualizado", "user": user.to_dict(include_admin=True)})


@admin_bp.route("/api/admin/users/<int:user_id>/subscription", methods=["PUT"])
@jwt_required()
def admin_set_user_subscription(user_id):
    """Asigna o actualiza una suscripción concreta para un usuario."""
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    data = request.get_json() or {}
    subscription_slug = data.get("subscription_slug")
    plan_slug = data.get("plan_slug")

    if not subscription_slug or not plan_slug:
        return jsonify({"msg": "subscription_slug y plan_slug son obligatorios"}), 400

    sub = Subscription.query.filter_by(slug=subscription_slug).first()
    if not sub:
        return jsonify({"msg": "Suscripción no encontrada"}), 404

    plan = SubscriptionPlan.query.filter_by(
        subscription_id=sub.id, slug=plan_slug
    ).first()
    if not plan:
        return jsonify({"msg": "Plan no encontrado para esa suscripción"}), 404

    existing = UserSubscription.query.filter_by(
        user_id=user.id, subscription_id=sub.id
    ).first()

    if existing:
        existing.plan_id = plan.id
        existing.is_active = True
        existing.subscribed_at = datetime.utcnow()
        db.session.commit()
        return jsonify({
            "msg": "Suscripción actualizada",
            "user_subscription": existing.to_dict(),
        })

    row = UserSubscription(
        user_id=user.id,
        subscription_id=sub.id,
        plan_id=plan.id,
        is_active=True,
    )
    db.session.add(row)
    db.session.commit()
    return jsonify({
        "msg": "Suscripción asignada",
        "user_subscription": row.to_dict(),
    }), 201


@admin_bp.route("/api/admin/bootstrap", methods=["POST"])
def admin_bootstrap():
    """
    Crear el primer usuario administrador usando token de entorno.
    Solo funciona si aún no existe ningún usuario con is_admin=True.
    """
    import os

    token = request.headers.get("X-Admin-Bootstrap-Token", "")
    expected = os.environ.get("ADMIN_BOOTSTRAP_TOKEN", "")
    if not expected or token != expected:
        return jsonify({"msg": "No autorizado"}), 403

    if User.query.filter_by(is_admin=True).first():
        return jsonify({"msg": "Ya existe un administrador"}), 400

    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"msg": "username, email y password son obligatorios"}), 400
    if len(password) < 8:
        return jsonify({"msg": "La contraseña debe tener al menos 8 caracteres"}), 400

    if User.query.filter(
        (func.lower(User.username) == username.lower()) | (User.email == email)
    ).first():
        return jsonify({"msg": "Usuario o email ya existe"}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        is_admin=True,
    )
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "msg": "Administrador creado",
        "user": user.to_dict(include_admin=True),
        "access_token": access_token,
    }), 201


@admin_bp.route("/api/admin/settings", methods=["GET"])
@jwt_required()
def admin_get_settings():
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    row = SiteSettings.get_singleton()
    return jsonify({"settings": row.to_public_dict()})


@admin_bp.route("/api/admin/settings", methods=["PATCH"])
@jwt_required()
def admin_patch_settings():
    if not _get_admin_user():
        return jsonify({"msg": "No autorizado"}), 403

    data = request.get_json() or {}
    row = SiteSettings.get_singleton()

    if "hide_subscriptions_public" in data:
        row.hide_subscriptions_public = bool(data["hide_subscriptions_public"])

    db.session.commit()
    return jsonify({"settings": row.to_public_dict()})
