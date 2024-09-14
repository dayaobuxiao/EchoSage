from flask import Flask
from flask_cors import CORS
from config import Config
from .extensions import db, login_manager, jwt, migrate
from .routes import auth, rag, admin, documents
from .middleware import check_if_user_deleted
import redis

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    CORS(app, resources={r"/api/*": {"origins": "http://43.139.213.206:3000"}})

    # 设置Redis用于JWT令牌撤销
    app.redis = redis.StrictRedis.from_url(app.config['REDIS_URL'])

    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(rag.bp, url_prefix='/api/rag')
    app.register_blueprint(admin.bp, url_prefix='/api/admin')
    app.register_blueprint(documents.bp, url_prefix='/api/documents')

    app.before_request(check_if_user_deleted)

    return app