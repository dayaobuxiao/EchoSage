from app import create_app
from app.models import User, Organization
from app.extensions import db
from sqlalchemy import inspect
import warnings

# 忽略 LangChain 的弃用警告
warnings.filterwarnings("ignore", category=DeprecationWarning)


def check_database():
    app = create_app()
    with app.app_context():
        print("Checking database status...")

        # 检查数据库连接
        try:
            db.engine.connect()
            print("Successfully connected to the database.")
        except Exception as e:
            print(f"Failed to connect to the database: {e}")
            return

        # 使用 inspect 检查表是否存在及其内容
        inspector = inspect(db.engine)
        tables_to_check = ['user', 'organization']
        for table_name in tables_to_check:
            if table_name in inspector.get_table_names():
                print(f"{table_name.capitalize()} table exists.")
                if table_name == 'user':
                    admin = User.query.filter_by(role='admin').first()
                    if admin:
                        print(f"Admin user found: {admin.username}")
                    else:
                        print("No admin user found.")
                elif table_name == 'organization':
                    organizations = Organization.query.all()
                    if organizations:
                        print(f"Found {len(organizations)} organizations:")
                        for organization in organizations:
                            print(f"- {organization.name} (ID: {organization.id})")
                    else:
                        print("No organizations found in the database.")
            else:
                print(f"{table_name.capitalize()} table does not exist.")

        # 检查数据库结构
        print("\nDatabase structure:")
        for table_name in inspector.get_table_names():
            print(f"\nTable: {table_name}")
            print("Columns:")
            for column in inspector.get_columns(table_name):
                print(f"- {column['name']} ({column['type']})")


if __name__ == "__main__":
    check_database()