"""
Tareas de refresco en background (catálogo e índices de precios).
Usa file lock para que solo un worker de Gunicorn ejecute cada job.
"""
import fcntl
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

LOCK_DIR = Path(__file__).resolve().parent.parent / "data" / "locks"
META_FILE = Path(__file__).resolve().parent.parent / "data" / "refresh_meta.json"


def _job_lock(name):
    if sys.platform == "win32":
        class _NoOpLock:
            def __enter__(self):
                return True

            def __exit__(self, *args):
                pass

        return _NoOpLock()

    class _FlockLock:
        def __enter__(self):
            LOCK_DIR.mkdir(parents=True, exist_ok=True)
            self._fh = open(LOCK_DIR / f"{name}.lock", "w")
            try:
                fcntl.flock(self._fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                self._acquired = True
            except BlockingIOError:
                self._acquired = False
            return self._acquired

        def __exit__(self, *args):
            if getattr(self, "_acquired", False):
                fcntl.flock(self._fh.fileno(), fcntl.LOCK_UN)
            self._fh.close()

    return _FlockLock()


def _save_meta(updates):
    import json

    meta = {}
    if META_FILE.exists():
        try:
            with open(META_FILE, encoding="utf-8") as f:
                meta = json.load(f)
        except (OSError, json.JSONDecodeError):
            meta = {}
    meta.update(updates)
    META_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(META_FILE, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def refresh_catalog_job():
    with _job_lock("refresh_catalog") as acquired:
        if not acquired:
            return
        try:
            from services import catalog

            logger.info("Refreshing catalog from ByMykel CSGO-API…")
            catalog.load_catalog(force_refresh=True)
            _save_meta({"catalog_last_refresh": datetime.now(timezone.utc).isoformat()})
            logger.info("Catalog refresh completed")
        except Exception:
            logger.exception("Catalog refresh failed")


def refresh_price_indexes_job():
    with _job_lock("refresh_price_indexes") as acquired:
        if not acquired:
            return
        try:
            from services import cache, price_aggregator

            logger.info("Refreshing Skinport and Waxpeer price indexes…")
            price_aggregator.refresh_market_indexes(force=True)
            cache.clear_prefix("weapons_list:")
            _save_meta({"price_indexes_last_refresh": datetime.now(timezone.utc).isoformat()})
            logger.info("Price indexes refresh completed")
        except Exception:
            logger.exception("Price indexes refresh failed")


def warm_caches_on_startup():
    """Precarga catálogo e índices al arrancar (sin bloquear el worker)."""
    if os.environ.get("ENABLE_CACHE_WARMUP", "1") != "1":
        return
    try:
        from services import catalog, price_aggregator

        catalog.load_catalog()
        price_aggregator.refresh_market_indexes(force=False)
    except Exception:
        logger.exception("Cache warmup failed")
