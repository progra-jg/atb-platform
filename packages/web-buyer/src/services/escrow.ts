import type { OrderStatus } from "../types";

export type EscrowRecordStatus = "pending" | "held" | "released" | "disputed";

export interface EscrowRecord {
  orderId: string;
  amount: number;
  total: number;
  status: EscrowRecordStatus;
  createdAt: string;
  releasedAt?: string;
  disputedAt?: string;
  buyerId: string;
  producteurId: string;
  orderStatus: OrderStatus;
}

// Used by EscrowCheckout.tsx
export type EscrowStatus = "pending" | "funded" | "delivered" | "confirmed" | "released" | "disputed" | "resolved" | "refunded" | "cancelled";

export interface EscrowContract {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  buyerName?: string;
  producteurName?: string;
  producteurId: string;
  amount: number;
  status: EscrowStatus;
  createdAt: string;
  updatedAt?: string;
  terms?: string;
  contractAddress?: string;
  txHash?: string;
  network?: string;
  depositTxHash?: string;
  fundedAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  releasedAt?: string;
  disputedAt?: string;
  disputed?: boolean;
  disputeReason?: string;
  resolution?: string;
}

const STORAGE_KEY = "atb_escrow_records";

function getAll(): EscrowRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAll(records: EscrowRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

export function createEscrow(
  orderId: string,
  amount: number,
  total: number,
  buyerId: string,
  producteurId: string,
  orderStatus: OrderStatus,
): EscrowRecord {
  const records = getAll();
  const existing = records.find((r) => r.orderId === orderId);
  if (existing) return existing;

  const record: EscrowRecord = {
    orderId,
    amount,
    total,
    status: "held",
    createdAt: new Date().toISOString(),
    buyerId,
    producteurId,
    orderStatus,
  };
  records.push(record);
  saveAll(records);
  return record;
}

export function releaseEscrow(orderId: string): EscrowRecord | null {
  const records = getAll();
  const idx = records.findIndex((r) => r.orderId === orderId);
  if (idx === -1) return null;
  records[idx].status = "released";
  records[idx].releasedAt = new Date().toISOString();
  saveAll(records);
  return records[idx];
}

export function disputeEscrow(orderId: string): EscrowRecord | null {
  const records = getAll();
  const idx = records.findIndex((r) => r.orderId === orderId);
  if (idx === -1) return null;
  records[idx].status = "disputed";
  records[idx].disputedAt = new Date().toISOString();
  saveAll(records);
  return records[idx];
}

export function getEscrow(orderId: string): EscrowRecord | null {
  return getAll().find((r) => r.orderId === orderId) || null;
}

export function getAllEscrows(): EscrowRecord[] {
  return getAll();
}

export function getEscrowsForUser(userId: string, as: "buyer" | "seller"): EscrowRecord[] {
  const key = as === "buyer" ? "buyerId" : "producteurId";
  return getAll().filter((r) => r[key] === userId);
}

function toContract(r: EscrowRecord): EscrowContract {
  return {
    id: r.orderId,
    orderId: r.orderId,
    buyerId: r.buyerId,
    sellerId: r.producteurId,
    producteurId: r.producteurId,
    amount: r.total,
    status: r.status === "held" ? "funded" as const : r.status === "released" ? "released" as const : r.status === "disputed" ? "disputed" as const : "pending" as const,
    createdAt: r.createdAt,
  };
}

export function fetchEscrows(): EscrowContract[] {
  return getAll().map(toContract);
}

export function fetchEscrowById(id: string): EscrowContract | null {
  const r = getEscrow(id);
  return r ? toContract(r) : null;
}

export function fundEscrow(orderId: string): Promise<EscrowContract | null> {
  return Promise.resolve(fetchEscrowById(orderId));
}

export function markDelivered(orderId: string): Promise<EscrowContract | null> {
  return Promise.resolve(fetchEscrowById(orderId));
}

export function confirmDelivery(orderId: string): Promise<EscrowContract | null> {
  releaseEscrow(orderId);
  return Promise.resolve(fetchEscrowById(orderId));
}

export function raiseDispute(orderId: string, _reason?: string): Promise<EscrowContract | null> {
  disputeEscrow(orderId);
  return Promise.resolve(fetchEscrowById(orderId));
}

export function getEscrowStats(userId: string, as: "buyer" | "seller") {
  const escrows = getEscrowsForUser(userId, as);
  const key = as === "buyer" ? "amount" : "total";
  const held = escrows.filter((r) => r.status === "held");
  const released = escrows.filter((r) => r.status === "released");
  const totalHeld = held.reduce((sum, r) => sum + (as === "buyer" ? r.amount : r.total), 0);
  const totalReleased = released.reduce((sum, r) => sum + (as === "buyer" ? r.amount : r.total), 0);
  return { total: escrows.length, held: held.length, released: released.length, totalHeld, totalReleased };
}
