import logging
import os
import threading
from datetime import timedelta

from flask import Flask
from extensions import db, jwt
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))


def create_app():
    app = Flask(__name__)
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
    from routes_contact import contact_bp
    app.register_blueprint(contact_bp)

    _start_background_services(app)

    return app


def _start_background_services(app):
    """Precarga cachés y arranca el scheduler (una vez por proceso)."""
    if getattr(app, "_background_started", False):
        return
    app._background_started = True

    def bootstrap():
        with app.app_context():
            from services.refresh_jobs import warm_caches_on_startup
            from services.scheduler import init_scheduler

            warm_caches_on_startup()
            init_scheduler(app)

    threading.Thread(target=bootstrap, daemon=True).start()


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
