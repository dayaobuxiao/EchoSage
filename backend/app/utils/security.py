import bcrypt
from flask_jwt_extended import create_access_token, get_jwt_identity
from datetime import timedelta
import re

def hash_password(password):
    """
    Hash a password for storing.
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(hashed_password, user_password):
    """
    Check hashed password. Using bcrypt, the salt is saved into the hash itself
    """
    return bcrypt.checkpw(user_password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_token(user_id):
    """
    Generate a JWT token for the given user ID.
    """
    expires = timedelta(days=7)
    return create_access_token(identity=user_id, expires_delta=expires)

def get_user_id_from_token():
    """
    Get the user ID from the JWT token in the current request.
    """
    return get_jwt_identity()

def is_safe_url(url):
    """
    Check if a URL is safe to redirect to.
    """
    return not re.match(r'^\s*javascript:', url, re.IGNORECASE)

def sanitize_input(input_string):
    """
    Sanitize user input to prevent XSS attacks.
    """
    return re.sub(r'[<>&\'\"]', '', input_string)


def check_password_strength(password):
    """
    Check the strength of a password.
    Returns a dict with 'strong' (bool) and 'message' (str) keys.
    """
    if len(password) < 8:
        return {'strong': False, 'message': "Password must be at least 8 characters long"}

    if not re.search(r'[A-Z]', password):
        return {'strong': False, 'message': "Password must include at least one uppercase letter"}

    if not re.search(r'[a-z]', password):
        return {'strong': False, 'message': "Password must include at least one lowercase letter"}

    if not re.search(r'\d', password):
        return {'strong': False, 'message': "Password must include at least one number"}

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return {'strong': False, 'message': "Password must include at least one special character"}

    return {'strong': True, 'message': "Password is strong"}