export type PayoutId = string & { readonly __brand: "PayoutId" };
export type PayoutIdempotencyKey = string & { readonly __brand: "PayoutIdempotencyKey" };
export type PayoutTraceId = string & { readonly __brand: "PayoutTraceId" };
export type PayoutPaymentId = string & { readonly __brand: "PayoutPaymentId" };
export type PayoutUserId = string & { readonly __brand: "PayoutUserId" };

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum PayoutMethod {
  MOBILE_MONEY = "mobile_money",
}

export enum PayoutProviderId {
  MTN_MOMO = "mtn_momo",
  MOOV_FLOOZ = "moov_flooz",
  ORANGE_MONEY = "orange_money",
}

export enum PayoutCurrency {
  XOF = "XOF",
}

export const PAYOUT_TRANSITIONS: ReadonlyMap<PayoutStatus, ReadonlyArray<PayoutStatus>> = new Map([
  [PayoutStatus.PENDING, [PayoutStatus.PROCESSING, PayoutStatus.CANCELLED]],
  [PayoutStatus.PROCESSING, [PayoutStatus.COMPLETED, PayoutStatus.FAILED]],
  [PayoutStatus.COMPLETED, []],
  [PayoutStatus.FAILED, [PayoutStatus.PROCESSING]],
  [PayoutStatus.CANCELLED, []],
]);

export const PAYOUT_TERMINAL_STATUSES: ReadonlySet<PayoutStatus> = new Set([PayoutStatus.COMPLETED, PayoutStatus.CANCELLED]);

export class PayoutStateMachine {
  static canTransition(from: PayoutStatus, to: PayoutStatus): boolean {
    return PAYOUT_TRANSITIONS.get(from)?.includes(to) ?? false;
  }

  static transition(from: PayoutStatus, to: PayoutStatus): PayoutStatus {
    if (!this.canTransition(from, to)) {
      throw new InvalidPayoutTransitionError(from, to);
    }
    return to;
  }

  static isTerminal(status: PayoutStatus): boolean {
    return PAYOUT_TERMINAL_STATUSES.has(status);
  }
}

export class InvalidPayoutTransitionError extends Error {
  constructor(from: PayoutStatus, to: PayoutStatus) {
    super(`Invalid payout state transition: ${from} → ${to}`);
    this.name = "InvalidPayoutTransitionError";
  }
}

export interface PayoutReadModel {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  status: PayoutStatus;
  producteurId: string;
  phone: string;
}

export enum PayoutDomainEventType {
  INITIATED = "payout.initiated",
  PROCESSING_STARTED = "payout.processing_started",
  COMPLETED = "payout.completed",
  FAILED = "payout.failed",
  CANCELLED = "payout.cancelled",
}

export interface PayoutDomainEvent<P = Record<string, unknown>> {
  readonly eventId: string;
  readonly eventType: PayoutDomainEventType;
  readonly aggregateId: PayoutId;
  readonly aggregateVersion: number;
  readonly payload: P;
  readonly traceId: PayoutTraceId;
  readonly metadata: { readonly timestamp: number; readonly source: string };
}

export interface PayoutInitiatedPayload {
  paymentId: string;
  producteurId: string;
  amount: number;
  currency: string;
  method: PayoutMethod;
  provider: PayoutProviderId;
  phone: string;
}

export interface PayoutCompletedPayload {
  providerRef: string;
  paidAt: Date;
}

export interface PayoutFailedPayload {
  reason: string;
  providerRef?: string;
}
