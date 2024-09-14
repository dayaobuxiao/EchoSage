from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.rag_service import RAGSystem
from ..models import User, Organization

bp = Blueprint('rag', __name__)

@bp.route('/query', methods=['POST'])
@jwt_required()
def rag_query():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    organization = Organization.query.get(user.organization_id)

    question = request.json['question']
    rag_system = RAGSystem(organization.id)
    answer = rag_system.query(question)
    return jsonify({"answer": answer})
