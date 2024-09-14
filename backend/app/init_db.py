import os
import logging
from app import create_app, db
from app.models import User, Organization
from app.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Starting database initialization")
    app = create_app()
    with app.app_context():
        db.create_all()
        logger.info("Database tables created successfully")

        admin_user = User.query.filter_by(username='admin').first()
        admin_password = os.environ.get('ADMIN_PASSWORD', 'secure_admin_password')

        if not admin_user:
            logger.info("Admin user not found, creating one")
            default_organization = Organization.query.filter_by(name='Default Organization').first()
            if not default_organization:
                default_organization = Organization(name='Default Organization')
                db.session.add(default_organization)
                db.session.commit()
                logger.info("Default organization created")

            admin_user = User(
                username='admin',
                email='admin@example.com',
                password_hash=hash_password(admin_password),
                organization_id=default_organization.id,
                role='admin'
            )
            db.session.add(admin_user)
            logger.info("Admin user created")
        else:
            logger.info("Admin user already exists, updating password")
            admin_user.password_hash = hash_password(admin_password)

        db.session.commit()
        logger.info("Admin user password set/updated")

if __name__ == '__main__':
    init_db()
    logger.info("Database initialization complete")