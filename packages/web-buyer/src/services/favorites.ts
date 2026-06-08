const STORAGE_KEY = "atb_favorites";

function getStored(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function setStored(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getFavorites(): string[] {
  return getStored();
}

export function isFavorite(id: string): boolean {
  return getStored().includes(id);
}

export function toggleFavorite(id: string): boolean {
  const current = getStored();
  const idx = current.indexOf(id);
  if (idx >= 0) { current.splice(idx, 1); setStored(current); return false; }
  else { current.push(id); setStored(current); return true; }
}
