import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStorage } from "../cache";

function mockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((k: string) => store.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => { store.set(k, v); }),
    removeItem: vi.fn((k: string) => { store.delete(k); }),
    clear: vi.fn(() => { store.clear(); }),
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
    get length() { return store.size; },
  } as const;
}

describe("createStorage", () => {
  let storage: ReturnType<typeof createStorage>;
  let mock: Storage;

  beforeEach(() => {
    mock = mockStorage();
    storage = createStorage("test", {
      getItem: (k) => mock.getItem(k),
      setItem: (k, v) => mock.setItem(k, v),
      removeItem: (k) => mock.removeItem(k),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and retrieves a value", () => {
    storage.set("key1", { name: "test" });
    expect(storage.get<{ name: string }>("key1")).toEqual({ name: "test" });
  });

  it("returns null for missing key", () => {
    expect(storage.get("nonexistent")).toBeNull();
  });

  it("respects TTL", () => {
    vi.useFakeTimers();
    storage.set("temp", "value", 100);
    expect(storage.get("temp")).toBe("value");
    vi.advanceTimersByTime(101);
    expect(storage.get("temp")).toBeNull();
  });

  it("removes a value", () => {
    storage.set("key", "val");
    storage.remove("key");
    expect(storage.get("key")).toBeNull();
  });

  it("clears all values in namespace", () => {
    storage.set("a", 1);
    storage.set("b", 2);
    storage.clear();
    expect(storage.get("a")).toBeNull();
    expect(storage.get("b")).toBeNull();
  });

  it("does not interfere with other namespaces", () => {
    const s1 = createStorage("ns1", {
      getItem: (k) => mock.getItem(k),
      setItem: (k, v) => mock.setItem(k, v),
      removeItem: (k) => mock.removeItem(k),
    });
    const s2 = createStorage("ns2", {
      getItem: (k) => mock.getItem(k),
      setItem: (k, v) => mock.setItem(k, v),
      removeItem: (k) => mock.removeItem(k),
    });
    s1.set("x", "from-ns1");
    s2.set("x", "from-ns2");
    expect(s1.get("x")).toBe("from-ns1");
    expect(s2.get("x")).toBe("from-ns2");
  });

  it("falls back to localStorage on miss in memory", () => {
    storage.set("persist", "stored");
    storage.remove("persist");
    expect(storage.get("persist")).toBeNull();
  });

  it("returns null for corrupted localStorage entry", () => {
    const store = new Map<string, string>();
    const badStorage = createStorage("corrupt", {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => { store.set(k, v); },
      removeItem: (k) => { store.delete(k); },
    });
    store.set("cache:corrupt::bad", "{invalid json");
    expect(badStorage.get("bad")).toBeNull();
  });
});
