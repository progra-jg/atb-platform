export type PayoutStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface PayoutRecord {
  id: string;
  paymentId: string;
  orderId: string;
  producteurId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  phone: string;
  providerRef?: string;
  status: PayoutStatus;
  statusMessage?: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutStats {
  totalDisbursed: number;
  totalTransactions: number;
  successRate: number;
  byProvider: { provider: string; count: number; volume: number }[];
  today: { count: number; volume: number };
  pendingCount: number;
}
