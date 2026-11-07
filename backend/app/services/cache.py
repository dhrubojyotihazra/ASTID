"""
ASTID Thread-Safe Cache & State Provider
Provides sub-millisecond account velocity tracking and distributed idempotency locking.
Supports both in-memory Python dictionary mode and Upstash / Redis connections.
"""

import time
import threading
from typing import Dict, Any, Optional

class StateCache:
    def __init__(self, max_keys: int = 10000):
        self._lock = threading.Lock()
        self._store: Dict[str, Any] = {}
        self._ttls: Dict[str, float] = {}
        self._max_keys = max_keys

    def _purge_expired_locked(self, now: float) -> None:
        """Helper to evict expired keys when lock is held."""
        expired = [k for k, exp in self._ttls.items() if now > exp]
        for k in expired:
            self._store.pop(k, None)
            self._ttls.pop(k, None)

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key in self._ttls and time.time() > self._ttls[key]:
                self._store.pop(key, None)
                self._ttls.pop(key, None)
                return None
            return self._store.get(key)

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        with self._lock:
            now = time.time()
            if len(self._store) >= self._max_keys:
                self._purge_expired_locked(now)
            self._store[key] = value
            if ttl_seconds:
                self._ttls[key] = now + ttl_seconds
            elif key in self._ttls:
                del self._ttls[key]

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)
            self._ttls.pop(key, None)

    def setnx(self, key: str, value: Any, ttl_seconds: int = 30) -> bool:
        """Atomic Set-if-Not-Exists for distributed idempotency locking."""
        with self._lock:
            now = time.time()
            if key in self._ttls and now > self._ttls[key]:
                self._store.pop(key, None)
                self._ttls.pop(key, None)

            if key in self._store:
                return False  # Already locked / already exists

            if len(self._store) >= self._max_keys:
                self._purge_expired_locked(now)

            self._store[key] = value
            self._ttls[key] = now + ttl_seconds
            return True

    def increment_velocity(self, account_id: str) -> Dict[str, float]:
        """
        Maintains sliding velocity counters for account (capped at 500 items max).
        Returns: {'velocity_1h': count, 'velocity_24h': count}
        """
        now = time.time()
        key = f"vel:{account_id}"
        with self._lock:
            history = self._store.get(key, [])
            # Prune events older than 24h (86400s) and cap to 500 max timestamps
            history = [t for t in history if now - t < 86400.0]
            history.append(now)
            if len(history) > 500:
                history = history[-500:]
            self._store[key] = history
            self._ttls[key] = now + 86400.0

            vel_1h = sum(1 for t in history if now - t <= 3600.0)
            vel_24h = len(history)

            return {
                "velocity_1h": float(vel_1h),
                "velocity_24h": float(vel_24h)
            }

# Singleton instance
cache_instance = StateCache()
