export type EscrowId = string & { readonly __brand: "EscrowId" };
export type OrderId = string & { readonly __brand: "OrderId" };
export type UserId = string & { readonly __brand: "UserId" };
export type ContractId = string & { readonly __brand: "ContractId" };

export function createId<T extends string>(): (val: string) => T {
  return (val: string) => val as unknown as T;
}

export enum EscrowStatus {
  PENDING = "pending",
  FUNDED = "funded",
  DELIVERED = "delivered",
  CONFIRMED = "confirmed",
  RELEASED = "released",
  REFUNDED = "refunded",
  DISPUTED = "disputed",
  RESOLVED = "resolved",
  CANCELLED = "cancelled",
}

export enum EscrowCurrency {
  USDT = "USDT",
  USDC = "USDC",
}

export enum EscrowNetwork {
  TRC20 = "TRC-20",
  POLYGON = "Polygon",
  BEP20 = "BEP-20",
}

export const ESCROW_TRANSITIONS: ReadonlyMap<EscrowStatus, ReadonlyArray<EscrowStatus>> = new Map([
  [EscrowStatus.PENDING,    [EscrowStatus.FUNDED, EscrowStatus.CANCELLED]],
  [EscrowStatus.FUNDED,     [EscrowStatus.DELIVERED, EscrowStatus.DISPUTED, EscrowStatus.REFUNDED]],
  [EscrowStatus.DELIVERED,  [EscrowStatus.CONFIRMED, EscrowStatus.DISPUTED]],
  [EscrowStatus.CONFIRMED,  [EscrowStatus.RELEASED]],
  [EscrowStatus.RELEASED,   []],
  [EscrowStatus.REFUNDED,   []],
  [EscrowStatus.DISPUTED,   [EscrowStatus.RESOLVED]],
  [EscrowStatus.RESOLVED,   [EscrowStatus.RELEASED, EscrowStatus.REFUNDED]],
  [EscrowStatus.CANCELLED,  []],
]);

export const TERMINAL_STATUSES: ReadonlySet<EscrowStatus> = new Set([
  EscrowStatus.RELEASED, EscrowStatus.REFUNDED, EscrowStatus.CANCELLED,
]);

export class EscrowStateMachine {
  static canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
    return ESCROW_TRANSITIONS.get(from)?.includes(to) ?? false;
  }

  static transition(from: EscrowStatus, to: EscrowStatus): EscrowStatus {
    if (!this.canTransition(from, to)) {
      throw new InvalidEscrowTransitionError(from, to);
    }
    return to;
  }

  static isTerminal(status: EscrowStatus): boolean {
    return TERMINAL_STATUSES.has(status);
  }

  static toDOT(): string {
    const lines: string[] = ['digraph EscrowFSM {', '  rankdir=LR;', '  node [style=rounded, shape=box];'];
    for (const [from, toList] of ESCROW_TRANSITIONS) {
      for (const to of toList) {
        lines.push(`  "${from}" -> "${to}";`);
      }
    }
    lines.push('}');
    return lines.join('\n');
  }
}

export class InvalidEscrowTransitionError extends Error {
  constructor(from: EscrowStatus, to: EscrowStatus) {
    super(`Invalid escrow state transition: ${from} → ${to}`);
    this.name = "InvalidEscrowTransitionError";
  }
}

export interface EscrowGuard {
  readonly name: string;
  check(escrow: EscrowReadModel, target: EscrowStatus): Promise<GuardResult>;
}

export interface GuardResult {
  allowed: boolean;
  reason?: string;
}

export interface EscrowReadModel {
  id: string;
  orderId: string;
  buyerId: string;
  producteurId: string;
  amount: number;
  currency: string;
  network: string;
  status: EscrowStatus;
  disputed: boolean;
  feePercentage: number;
  contractAddress?: string;
}

export class FundedGuard implements EscrowGuard {
  readonly name = "FundedGuard";
  async check(escrow: EscrowReadModel, target: EscrowStatus): Promise<GuardResult> {
    if (target === EscrowStatus.FUNDED && escrow.amount <= 0) {
      return { allowed: false, reason: `Escrow amount must be > 0, got ${escrow.amount}` };
    }
    return { allowed: true };
  }
}

export class DisputeGuard implements EscrowGuard {
  readonly name = "DisputeGuard";
  async check(escrow: EscrowReadModel, target: EscrowStatus): Promise<GuardResult> {
    if (target === EscrowStatus.DISPUTED && escrow.disputed) {
      return { allowed: false, reason: "Escrow is already disputed" };
    }
    return { allowed: true };
  }
}

export enum EscrowDomainEventType {
  CREATED = "escrow.created",
  FUNDED = "escrow.funded",
  DELIVERED = "escrow.delivered",
  CONFIRMED = "escrow.confirmed",
  RELEASED = "escrow.released",
  REFUNDED = "escrow.refunded",
  DISPUTE_RAISED = "escrow.dispute_raised",
  DISPUTE_RESOLVED = "escrow.dispute_resolved",
  CANCELLED = "escrow.cancelled",
}

export interface EscrowDomainEvent<P = Record<string, unknown>> {
  readonly eventId: string;
  readonly eventType: EscrowDomainEventType;
  readonly aggregateId: EscrowId;
  readonly aggregateVersion: number;
  readonly payload: P;
  readonly traceId: string;
  readonly metadata: {
    readonly timestamp: number;
    readonly source: string;
  };
}

export interface EscrowCreatedPayload {
  orderId: OrderId;
  buyerId: UserId;
  producteurId: UserId;
  amount: number;
  currency: string;
  network: string;
  terms?: string;
}

export interface EscrowFundedPayload {
  contractAddress: string;
  depositTxHash: string;
}

export interface DeliveryConfirmedPayload {
  confirmedAt: string;
}

export interface EscrowReleasedPayload {
  releaseTxHash: string;
  releasedAt: string;
}

export interface DisputeRaisedPayload {
  raisedBy: UserId;
  reason: string;
}

export interface DisputeResolvedPayload {
  resolvedBy: UserId;
  resolution: string;
}
