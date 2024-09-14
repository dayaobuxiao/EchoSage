from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models import User, Organization
from ..extensions import db
from ..utils.security import hash_password

bp = Blueprint('admin', __name__)

@bp.route('/organizations', methods=['GET'])
@jwt_required()
def get_organizations():
    organizations = Organization.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in organizations])

@bp.route('/organizations', methods=['POST'])
@jwt_required()
def create_organization():
    data = request.get_json()
    organization = Organization(name=data['name'])
    db.session.add(organization)
    db.session.commit()
    return jsonify({"id": organization.id, "name": organization.name}), 201

@bp.route('/organizations/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_organization(id):
    organization = Organization.query.get(id)
    if not organization:
        return jsonify({"error": "Organization not found"}), 404
    db.session.delete(organization)
    db.session.commit()
    return jsonify({"message": "Organization deleted successfully"}), 200

@bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "email": u.email, "organization_id": u.organization_id, "role": u.role} for u in users])

@bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    data = request.get_json()
    user = User(
        username=data['username'],
        email=data['email'],
        organization_id=data['organization_id'],
        role=data.get('role', 'user')
    )
    user.password_hash = hash_password(data['password'])
    db.session.add(user)
    try:
        db.session.commit()
        return jsonify({"id": user.id, "username": user.username, "email": user.email, "organization_id": user.organization_id, "role": user.role}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
def update_user(id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    # Check if we're changing the role of the last admin
    if user.role == 'admin' and data.get('role') != 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot change role of the last admin"}), 403

    user.role = data.get('role', user.role)
    if 'password' in data:
        user.password_hash = hash_password(data['password'])

    try:
        db.session.commit()
        return jsonify({"id": user.id, "username": user.username, "email": user.email,
                        "organization_id": user.organization_id, "role": user.role}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@bp.route('/users/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get(id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Check if we're deleting the last admin
    if user.role == 'admin':
        admin_count = User.query.filter_by(role='admin').count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot delete the last admin"}), 403

    db.session.delete(user)
    db.session.commit()

    # Add user ID to Redis set of deleted users
    current_app.redis.sadd('deleted_users', str(id))

    return jsonify({"message": "User deleted successfully"}), 200