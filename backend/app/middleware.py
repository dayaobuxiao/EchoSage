from flask import jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def check_if_user_deleted():
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id is not None:
            if current_app.redis.sismember('deleted_users', str(user_id)):
                return jsonify({"error": "User account has been deleted"}), 401
    except:
        # If there's an error verifying the JWT, we just skip the check
        pass
    return None