"""
Caché en memoria con caducidad (TTL) para no saturar las APIs externas.
"""
import time
from threading import Lock

_store = {}
_lock = Lock()


def get(key):
    with _lock:
        entry = _store.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            del _store[key]
            return None
        return entry["value"]


def set(key, value, ttl_seconds=300):
    with _lock:
        _store[key] = {
            "value": value,
            "expires_at": time.time() + ttl_seconds,
        }


def clear():
    with _lock:
        _store.clear()
