"""
Migraciones ligeras para SQLite (columnas nuevas sin Alembic).
"""
from sqlalchemy import inspect, text

from extensions import db


def run_migrations():
    """Añade columnas/tablas que create_all() no altera en tablas existentes."""
    from models import User

    engine = db.engine
    inspector = inspect(engine)

    if "users" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("users")}
        if "is_admin" not in cols:
            dialect = engine.dialect.name
            if dialect == "sqlite":
                stmt_alter = text("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
                stmt_fix = text("UPDATE users SET is_admin = 0 WHERE is_admin IS NULL")
            else:
                stmt_alter = text(
                    "ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE"
                )
                stmt_fix = text("UPDATE users SET is_admin = FALSE WHERE is_admin IS NULL")

            with engine.begin() as conn:
                conn.execute(stmt_alter)
                try:
                    conn.execute(stmt_fix)
                except Exception:
                    pass

    db.session.expire_all()
    try:
        User.query.filter(User.is_admin.is_(None)).update(
            {"is_admin": False}, synchronize_session=False
        )
        db.session.commit()
    except Exception:
        db.session.rollback()
