const STORAGE_KEY = "atb_saved_payment";

export interface SavedPaymentMethod {
  methodId: string;
  providerId: string;
  phone?: string;
  lastUsed: number;
  useCount: number;
}

export function getSavedPayment(): SavedPaymentMethod | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedPaymentMethod;
  } catch {
    return null;
  }
}

export function savePaymentMethod(methodId: string, providerId: string, phone?: string): void {
  try {
    const existing = getSavedPayment();
    const updated: SavedPaymentMethod = {
      methodId,
      providerId,
      phone: phone || existing?.phone,
      lastUsed: Date.now(),
      useCount: (existing?.useCount || 0) + 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function clearSavedPayment(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function formatLastUsed(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "À l'instant";
  if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)}h`;
  return `Il y a ${Math.floor(diff / 86_400_000)}j`;
}
