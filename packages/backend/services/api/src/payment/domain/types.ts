// ---- Branded Types (compile-time type safety) ----
export type PaymentId = string & { readonly __brand: "PaymentId" };
export type IdempotencyKey = string & { readonly __brand: "IdempotencyKey" };
export type TraceId = string & { readonly __brand: "TraceId" };
export type OrderId = string & { readonly __brand: "OrderId" };
export type UserId = string & { readonly __brand: "UserId" };

// Helper function
export function createId<T extends string>(): (val: string) => T {
  return (val: string) => val as unknown as T;
}

// ---- Enums ----
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  MOBILE_MONEY = "mobile_money",
  CARD = "card",
  BANK_TRANSFER = "bank_transfer",
  CRYPTO = "crypto",
}

export enum PaymentProviderId {
  MTN_MOMO = "mtn_momo",
  MOOV_FLOOZ = "moov_flooz",
  ORANGE_MONEY = "orange_money",
  FEDAPAY = "fedapay",
  CINETPAY = "cinetpay",
  BANK_XOF = "bank_xof",
  USDT_TRC20 = "usdt_trc20",
  USDC_POLYGON = "usdc_polygon",
}

export enum Currency {
  XOF = "XOF",
  USDT = "USDT",
  USDC = "USDC",
}

// ---- Formal Finite State Machine ----
// Each transition is a [from, to] pair
export const PAYMENT_TRANSITIONS: ReadonlyMap<PaymentStatus, ReadonlyArray<PaymentStatus>> = new Map([
  [PaymentStatus.PENDING,    [PaymentStatus.PROCESSING, PaymentStatus.COMPLETED, PaymentStatus.CANCELLED]],
  [PaymentStatus.PROCESSING, [PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.CANCELLED]],
  [PaymentStatus.COMPLETED,  [PaymentStatus.REFUNDED]],
  [PaymentStatus.FAILED,     [PaymentStatus.PROCESSING]],
  [PaymentStatus.REFUNDED,   []],
  [PaymentStatus.CANCELLED,  []],
]);

export const TERMINAL_STATUSES: ReadonlySet<PaymentStatus> = new Set([PaymentStatus.REFUNDED, PaymentStatus.CANCELLED]);

export class PaymentStateMachine {
  static canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    return PAYMENT_TRANSITIONS.get(from)?.includes(to) ?? false;
  }

  static transition(from: PaymentStatus, to: PaymentStatus): PaymentStatus {
    if (!this.canTransition(from, to)) {
      throw new InvalidPaymentTransitionError(from, to);
    }
    return to;
  }

  static isTerminal(status: PaymentStatus): boolean {
    return TERMINAL_STATUSES.has(status);
  }

  static toDOT(): string {
    const lines: string[] = ['digraph PaymentFSM {', '  rankdir=LR;', '  node [style=rounded, shape=box];'];
    for (const [from, toList] of PAYMENT_TRANSITIONS) {
      for (const to of toList) {
        lines.push(`  "${from}" -> "${to}";`);
      }
    }
    lines.push('}');
    return lines.join('\n');
  }
}

export class InvalidPaymentTransitionError extends Error {
  constructor(from: PaymentStatus, to: PaymentStatus) {
    super(`Invalid state transition: ${from} → ${to}`);
    this.name = "InvalidPaymentTransitionError";
  }
}

// ---- Transition Guards ----
export interface TransitionGuard {
  readonly name: string;
  check(payment: PaymentReadModel, target: PaymentStatus): Promise<GuardResult>;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

export interface PaymentReadModel {
  id: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  status: PaymentStatus;
  buyerId: string;
  orderId: string;
}

// Built-in guards
export class AmountGuard implements TransitionGuard {
  readonly name = "AmountGuard";
  async check(payment: PaymentReadModel, target: PaymentStatus): Promise<GuardResult> {
    if (target === PaymentStatus.COMPLETED && payment.amount <= 0) {
      return { allowed: false, reason: `Amount must be > 0, got ${payment.amount}` };
    }
    return { allowed: true };
  }
}

// ---- Domain Events ----
export enum PaymentDomainEventType {
  INITIATED = "payment.initiated",
  PROCESSING_STARTED = "payment.processing_started",
  COMPLETED = "payment.completed",
  FAILED = "payment.failed",
  REFUNDED = "payment.refunded",
  CANCELLED = "payment.cancelled",
  VERIFIED_BY_ADMIN = "payment.verified_by_admin",
  WEBHOOK_RECEIVED = "payment.webhook_received",
}

export interface PaymentDomainEvent<P = Record<string, unknown>> {
  readonly eventId: string;
  readonly eventType: PaymentDomainEventType;
  readonly aggregateId: PaymentId;
  readonly aggregateVersion: number;
  readonly payload: P;
  readonly traceId: TraceId;
  readonly metadata: {
    readonly timestamp: number;
    readonly source: string;
  };
}

export interface PaymentInitiatedPayload {
  orderId: OrderId;
  buyerId: UserId;
  producteurId?: UserId;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  provider: PaymentProviderId;
}

export interface PaymentCompletedPayload {
  providerRef: string;
  paidAt: Date;
}

export interface PaymentFailedPayload {
  reason: string;
  providerRef?: string;
}

// ---- Idempotency ----
export interface IdempotencyRecord {
  key: string;
  consumerId: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: Date;
  expiresAt: Date;
}

// ---- Outbox ----
export interface OutboxEventRecord {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: "pending" | "published" | "failed";
  traceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  publishedAt?: Date;
  retryCount: number;
}
