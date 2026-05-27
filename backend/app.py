import os
from datetime import timedelta

from flask import Flask
from extensions import db, jwt
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    # Configuration
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dev.db'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'dev-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    with app.app_context():
        import models
        db.create_all()
        from db_migrate import run_migrations
        run_migrations()
        from seed_subscriptions import seed_subscriptions
        seed_subscriptions()

    import routes
    from routes_weapons import weapons_bp
    from routes_subscriptions import subscriptions_bp

    app.register_blueprint(routes.api_bp)
    app.register_blueprint(weapons_bp)
    app.register_blueprint(subscriptions_bp)
    from routes_csbot import csbot_bp
    app.register_blueprint(csbot_bp)

    from routes_visits import visits_bp
    from routes_admin import admin_bp

    app.register_blueprint(visits_bp)
    app.register_blueprint(admin_bp)

    return app

def _warm_caches():
    try:
        from services import catalog, price_aggregator

        catalog.load_catalog()
        price_aggregator._load_waxpeer_index()
    except Exception:
        pass


if __name__ == '__main__':
    import threading

    app = create_app()
    threading.Thread(target=_warm_caches, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, debug=True)
