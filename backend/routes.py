from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models import User

api_bp = Blueprint('api', __name__)


@api_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'msg': 'Faltan campos'}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'msg': 'Usuario o email ya existe'}), 400

    user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'msg': 'Usuario creado', 'user': user.to_dict(include_admin=True)}), 201


@api_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username') or data.get('email')
    password = data.get('password')

    if not identifier or not password:
        return jsonify({'msg': 'Faltan credenciales'}), 400

    user = User.query.filter((User.username == identifier) | (User.email == identifier)).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'msg': 'Credenciales inválidas'}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify({'access_token': access_token, 'user': user.to_dict(include_admin=True)})


@api_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'msg': 'Usuario no encontrado'}), 404
    return jsonify({'user': user.to_dict(include_admin=True)})


@api_bp.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'msg': 'Usuario no encontrado'}), 404

    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip()
    password = data.get('password')

    if not username or not email:
        return jsonify({'msg': 'Usuario y email son obligatorios'}), 400

    existing = User.query.filter(
        ((User.username == username) | (User.email == email)) & (User.id != user.id)
    ).first()
    if existing:
        return jsonify({'msg': 'Usuario o email ya en uso'}), 400

    user.username = username
    user.email = email
    if password:
        if len(password) < 6:
            return jsonify({'msg': 'La contraseña debe tener al menos 6 caracteres'}), 400
        user.password_hash = generate_password_hash(password)

    db.session.commit()
    return jsonify({'msg': 'Perfil actualizado', 'user': user.to_dict(include_admin=True)})


@api_bp.route('/api/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    user_id = get_jwt_identity()
    user = db.session.get(User, int(user_id))
    if not user:
        return jsonify({'msg': 'Usuario no encontrado'}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({'msg': 'Cuenta eliminada'})
