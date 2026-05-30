"""
Caché en memoria con caducidad (TTL). Entradas persistentes también en disco
(backend/data/runtime_cache/) para sobrevivir reinicios entre workers.
"""
import hashlib
import json
import time
from pathlib import Path
from threading import Lock

_store = {}
_lock = Lock()

DISK_CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "runtime_cache"


def _disk_path(key):
    safe = hashlib.sha256(key.encode("utf-8")).hexdigest()
    return DISK_CACHE_DIR / f"{safe}.json"


def _read_disk(key):
    path = _disk_path(key)
    if not path.exists():
        return None
    try:
        with open(path, encoding="utf-8") as f:
            entry = json.load(f)
        if time.time() > entry.get("expires_at", 0):
            path.unlink(missing_ok=True)
            return None
        return entry.get("value")
    except (OSError, json.JSONDecodeError, TypeError):
        path.unlink(missing_ok=True)
        return None


def _write_disk(key, value, expires_at):
    DISK_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    path = _disk_path(key)
    tmp = path.with_suffix(".tmp")
    payload = {"expires_at": expires_at, "value": value}
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    tmp.replace(path)


def _delete_disk(key):
    _disk_path(key).unlink(missing_ok=True)


def get(key, *, allow_disk=True):
    with _lock:
        entry = _store.get(key)
        if entry:
            if time.time() > entry["expires_at"]:
                del _store[key]
            else:
                return entry["value"]

    if allow_disk:
        value = _read_disk(key)
        if value is not None:
            with _lock:
                entry = _store.get(key)
                if entry and time.time() <= entry["expires_at"]:
                    return entry["value"]
            return value
    return None


def set(key, value, ttl_seconds=300, *, persist=False):
    expires_at = time.time() + ttl_seconds
    with _lock:
        _store[key] = {"value": value, "expires_at": expires_at}
    if persist:
        try:
            _write_disk(key, value, expires_at)
        except OSError:
            pass


def delete(key):
    with _lock:
        _store.pop(key, None)
    _delete_disk(key)


def clear_prefix(prefix):
    """Elimina entradas en memoria cuyo key empieza por prefix."""
    with _lock:
        for key in list(_store.keys()):
            if key.startswith(prefix):
                del _store[key]


def clear():
    with _lock:
        _store.clear()
