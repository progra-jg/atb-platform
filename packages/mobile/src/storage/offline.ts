import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("agritrace_offline.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export const cacheSet = async (key: string, value: unknown): Promise<void> => {
  const database = await getDb();
  await database.runAsync(
    "INSERT OR REPLACE INTO cache (key, value, updated_at) VALUES (?, ?, ?)",
    key, JSON.stringify(value), Date.now(),
  );
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>("SELECT value FROM cache WHERE key = ?", key);
  return row ? JSON.parse(row.value) as T : null;
};

export const cacheRemove = async (key: string): Promise<void> => {
  const database = await getDb();
  await database.runAsync("DELETE FROM cache WHERE key = ?", key);
};

export const cacheClear = async (): Promise<void> => {
  const database = await getDb();
  await database.runAsync("DELETE FROM cache");
};

export const enqueueAction = async (action: string, payload: unknown): Promise<void> => {
  const database = await getDb();
  await database.runAsync(
    "INSERT INTO pending_actions (action, payload, created_at) VALUES (?, ?, ?)",
    action, JSON.stringify(payload), Date.now(),
  );
};

export const dequeueActions = async (): Promise<{ id: number; action: string; payload: unknown }[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<{ id: number; action: string; payload: string; created_at: number }>(
    "SELECT * FROM pending_actions ORDER BY created_at ASC LIMIT 10",
  );
  return rows.map((r) => ({ id: r.id, action: r.action, payload: JSON.parse(r.payload) }));
};

export const removeAction = async (id: number): Promise<void> => {
  const database = await getDb();
  await database.runAsync("DELETE FROM pending_actions WHERE id = ?", id);
};
