"""Registro público de visitas (estadísticas agregadas solo en admin)."""
from flask import Blueprint, request, jsonify

from extensions import db
from models import PageVisit

visits_bp = Blueprint("visits", __name__)


@visits_bp.route("/api/visits", methods=["POST"])
def track_visit():
    data = request.get_json(silent=True) or {}
    path = (data.get("path") or request.args.get("path") or "/").strip() or "/"
    if len(path) > 250:
        path = path[:250]

    row = PageVisit(path=path)
    db.session.add(row)
    db.session.commit()
    return jsonify({"ok": True}), 201
