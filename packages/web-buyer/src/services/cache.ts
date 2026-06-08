interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

type StorageAdapter = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const NS_SEPARATOR = "::";
const DEFAULT_TTL = 5 * 60 * 1000;
const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
let GC_INTERVAL: ReturnType<typeof setInterval> | null = null;

function gc() {
  const now = Date.now();
  for (const [key, entry] of MEMORY_CACHE) {
    if (entry.expiresAt <= now) MEMORY_CACHE.delete(key);
  }
}
function ensureGc() {
  if (!GC_INTERVAL) GC_INTERVAL = setInterval(gc, 15_000);
}
ensureGc();

function fullKey(namespace: string, key: string): string {
  return `${namespace}${NS_SEPARATOR}${key}`;
}

export function createStorage(namespace: string, adapter?: StorageAdapter) {
  const storage: StorageAdapter = adapter ?? {
    getItem(k) {
      try { return localStorage.getItem(k); } catch { return null; }
    },
    setItem(k, v) {
      try { localStorage.setItem(k, v); } catch { /* quota */ }
    },
    removeItem(k) {
      try { localStorage.removeItem(k); } catch { /* noop */ }
    },
  };

  const trackedKeys = new Set<string>();

  function memKey(k: string): string {
    return fullKey(namespace, k);
  }

  function lsKey(k: string): string {
    return `cache:${fullKey(namespace, k)}`;
  }

  function get<T>(key: string): T | null {
    const mk = memKey(key);
    const mem = MEMORY_CACHE.get(mk) as CacheEntry<T> | undefined;
    if (mem) {
      if (mem.expiresAt > Date.now()) return mem.value;
      MEMORY_CACHE.delete(mk);
    }
    try {
      const raw = storage.getItem(lsKey(key));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (parsed.expiresAt <= Date.now()) {
        storage.removeItem(lsKey(key));
        trackedKeys.delete(lsKey(key));
        return null;
      }
      MEMORY_CACHE.set(mk, parsed);
      return parsed.value;
    } catch {
      return null;
    }
  }

  function set<T>(key: string, value: T, ttlMs = DEFAULT_TTL): void {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs, storedAt: Date.now() };
    const mk = memKey(key);
    MEMORY_CACHE.set(mk, entry as CacheEntry<unknown>);
    trackedKeys.add(lsKey(key));
    try {
      storage.setItem(lsKey(key), JSON.stringify(entry));
    } catch { /* quota */ }
  }

  function remove(key: string): void {
    const mk = memKey(key);
    MEMORY_CACHE.delete(mk);
    trackedKeys.delete(lsKey(key));
    try { storage.removeItem(lsKey(key)); } catch { /* noop */ }
  }

  function clear(): void {
    const prefix = lsKey("");
    for (const k of MEMORY_CACHE.keys()) {
      if (k.startsWith(memKey(""))) MEMORY_CACHE.delete(k);
    }
    for (const k of trackedKeys) {
      if (k.startsWith(prefix)) {
        try { storage.removeItem(k); } catch { /* noop */ }
      }
    }
    trackedKeys.clear();
  }

  function size(): number {
    let count = 0;
    for (const k of trackedKeys) {
      if (k.startsWith(lsKey(""))) count++;
    }
    for (const k of MEMORY_CACHE.keys()) {
      if (k.startsWith(memKey(""))) count++;
    }
    return count;
  }

  return { get, set, remove, clear, size };
}

export type CacheStore = ReturnType<typeof createStorage>;
