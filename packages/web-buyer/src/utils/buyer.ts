const STORAGE_KEY = "atb_buyer_id";

export function getBuyerId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = "b0000000-0001-4000-8000-000000000001";
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function setBuyerId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}
