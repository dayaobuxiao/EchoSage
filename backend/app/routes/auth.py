from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, get_jwt
from ..models import User, Organization
from ..extensions import db
from ..utils.security import check_password_strength, hash_password, check_password
import logging
import re

bp = Blueprint('auth', __name__)

USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_]{3,20}$')
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128

@bp.route('/organizations', methods=['GET'])
def get_organizations():
    organizations = Organization.query.all()
    return jsonify([{"id": c.id, "name": c.name} for c in organizations])

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    logging.info(f"Login attempt for username: {username}")

    if not username or not password:
        logging.warning("Login attempt with missing username or password")
        return jsonify({"error": "Username and password are required"}), 400

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        logging.info(f"Successful login for user: {username}")
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify(access_token=access_token, refresh_token=refresh_token, user_role=user.role), 200
    else:
        logging.warning(f"Failed login attempt for user: {username}")
        return jsonify({"error": "Invalid username or password"}), 401

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user)
    return jsonify(access_token=new_access_token), 200

@bp.route('/check_username', methods=['POST'])
def check_username():
    username = request.json.get('username')
    if not username:
        return jsonify({"error": "Username is required"}), 400
    if not USERNAME_REGEX.match(username):
        return jsonify({"error": "Username must be 3-20 characters long and contain only letters, numbers, and underscores"}), 400
    existing_user = User.query.filter_by(username=username).first()
    return jsonify({"available": existing_user is None})

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    organization_id = data.get('organization_id')

    # Check if all required fields are provided
    if not all([username, email, password, organization_id]):
        return jsonify({"error": "All fields are required"}), 400

    # Check username format
    if not USERNAME_REGEX.match(username):
        return jsonify({"error": "Invalid username format"}), 400

    # Check if username already exists
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    # Check if email already registered
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    # Check password strength
    password_check = check_password_strength(password)
    if not password_check['strong']:
        return jsonify({"error": password_check['message']}), 400

    try:
        user = User(username=username, email=email, organization_id=organization_id)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "An error occurred while registering the user"}), 500

    return jsonify({"message": "User registered successfully"}), 201

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
        jwt = get_jwt()
        if jwt:
            jti = jwt["jti"]
            current_app.redis.setex(
                jti,
                current_app.config["JWT_ACCESS_TOKEN_EXPIRES"],
                'true'
            )
            current_app.logger.info(f"User logged out: JTI={jti}")
        return jsonify({"message": "Successfully logged out"}), 200

@bp.route('/user', methods=['GET'])
@jwt_required()
def get_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "organization_id": user.organization_id,
        "role": user.role
    }), 200


@bp.route('/user/update', methods=['POST'])
@jwt_required()
def update_user_info():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already in use"}), 400
        user.email = data['email']

    if 'newPassword' in data:
        password_check = check_password_strength(data['newPassword']) # Check password strength
        if not password_check['strong']:
            return jsonify({"error": password_check['message']}), 400

        if check_password(user.password_hash, data['newPassword']):
            return jsonify({"error": "New password must be different from the current password"}), 400

        user.password_hash = hash_password(data['newPassword'])

    db.session.commit()
    return jsonify({"message": "User information updated successfully"}), 200

@bp.route('/delete-account', methods=['POST'])
@jwt_required()
def delete_account():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    password = request.json.get('password')
    if not password:
        return jsonify({"error": "Password is required"}), 400

    if not user.check_password(password):
        return jsonify({"error": "Invalid password"}), 400

    try:
        db.session.delete(user)
        db.session.commit()
        jti = get_jwt()["jti"]
        current_app.redis.set(jti, "", ex=current_app.config["JWT_ACCESS_TOKEN_EXPIRES"])
        return jsonify({"message": "Account successfully deleted"}), 200
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error deleting user account. User ID: {user_id}. Error: {str(e)}")
        return jsonify({"error": "An error occurred while deleting the account"}), 500

@bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"message": "Token is valid", "user_id": current_user_id}), 200