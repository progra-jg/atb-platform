import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Escrow } from "../../entities/escrow.entity";
import {
  EscrowStatus, EscrowId, EscrowDomainEventType,
  EscrowStateMachine, FundedGuard, DisputeGuard, EscrowGuard, EscrowReadModel,
} from "../domain/types";
import { EscrowRepository, EscrowStats } from "../infrastructure/repository";
import { EscrowEventBus } from "../infrastructure/event-bus";
import { MockBlockchainProvider } from "../infrastructure/blockchain";
import { DisputeResolutionService, DisputeResolution } from "../infrastructure/dispute";
import { EscrowConfigFactory } from "../domain/methods";

export interface CreateEscrowCommand {
  orderId: string;
  buyerId: string;
  producteurId: string;
  amount: number;
  currency?: string;
  network?: string;
  terms?: string;
  feePercentage?: number;
}

export interface FundEscrowCommand {
  escrowId: string;
  buyerId: string;
}

export interface MarkDeliveredCommand {
  escrowId: string;
  producteurId: string;
  producteurSignature?: string;
}

export interface ConfirmDeliveryCommand {
  escrowId: string;
  buyerId: string;
  buyerSignature?: string;
}

export interface ReleaseEscrowCommand {
  escrowId: string;
  adminId: string;
}

export interface RaiseDisputeCommand {
  escrowId: string;
  raisedBy: string;
  reason: string;
  evidence?: string;
}

export interface ResolveDisputeCommand {
  escrowId: string;
  adminId: string;
  resolution: string;
}

export interface CancelEscrowCommand {
  escrowId: string;
  buyerId: string;
  reason?: string;
}

export interface EscrowResponse {
  id: string;
  orderId: string;
  contractId?: string;
  buyerId: string;
  producteurId: string;
  amount: number;
  currency: string;
  network: string;
  status: string;
  contractAddress?: string;
  depositTxHash?: string;
  releaseTxHash?: string;
  refundTxHash?: string;
  fundedAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  releasedAt?: string;
  terms?: string;
  feePercentage: number;
  disputed: boolean;
  disputedAt?: string;
  disputeReason?: string;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CreateEscrowUseCase {
  private readonly logger = new Logger(CreateEscrowUseCase.name);
  private readonly guards: EscrowGuard[] = [new FundedGuard()];

  constructor(
    private readonly repo: EscrowRepository,
    private readonly blockchain: MockBlockchainProvider,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: CreateEscrowCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.create({
      id: crypto.randomUUID(),
      orderId: cmd.orderId,
      buyerId: cmd.buyerId,
      producteurId: cmd.producteurId,
      amount: cmd.amount,
      currency: cmd.currency || "USDT",
      network: cmd.network || "TRC-20",
      status: EscrowStatus.PENDING,
      terms: cmd.terms,
      feePercentage: cmd.feePercentage ?? 0.5,
    });

    const readModel: EscrowReadModel = this.repo.toReadModel(escrow);
    for (const guard of this.guards) {
      const result = await guard.check(readModel, EscrowStatus.FUNDED);
      if (!result.allowed) throw new BadRequestException(`Guard failed: ${result.reason}`);
    }

    const contract = await this.blockchain.deployContract(
      cmd.orderId, cmd.amount, cmd.buyerId, cmd.producteurId,
    );

    escrow.contractAddress = contract.contractAddress;
    escrow.contractId = contract.txHash;

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.CREATED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: {
        orderId: cmd.orderId,
        buyerId: cmd.buyerId,
        producteurId: cmd.producteurId,
        amount: cmd.amount,
        currency: cmd.currency || "USDT",
        network: cmd.network || "TRC-20",
        terms: cmd.terms,
      },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "CreateEscrowUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class FundEscrowUseCase {
  private readonly logger = new Logger(FundEscrowUseCase.name);

  constructor(
    private readonly repo: EscrowRepository,
    private readonly blockchain: MockBlockchainProvider,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: FundEscrowCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const currentStatus = escrow.status as EscrowStatus;
    const newStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.FUNDED);

    const deposit = await this.blockchain.simulateDeposit(escrow.contractAddress, parseFloat(escrow.amount as any));

    escrow.status = newStatus;
    escrow.depositTxHash = deposit.txHash;
    escrow.fundedAt = new Date();

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.FUNDED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { contractAddress: escrow.contractAddress, depositTxHash: deposit.txHash },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "FundEscrowUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class MarkDeliveredUseCase {
  constructor(
    private readonly repo: EscrowRepository,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: MarkDeliveredCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const currentStatus = escrow.status as EscrowStatus;
    const newStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.DELIVERED);

    escrow.status = newStatus;
    escrow.deliveredAt = new Date();
    if (cmd.producteurSignature) escrow.producteurSignature = cmd.producteurSignature;

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.DELIVERED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { deliveredAt: saved.deliveredAt.toISOString() },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "MarkDeliveredUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class ConfirmDeliveryUseCase {
  constructor(
    private readonly repo: EscrowRepository,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: ConfirmDeliveryCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const currentStatus = escrow.status as EscrowStatus;
    const newStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.CONFIRMED);

    escrow.status = newStatus;
    escrow.confirmedAt = new Date();
    if (cmd.buyerSignature) escrow.buyerSignature = cmd.buyerSignature;

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.CONFIRMED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { confirmedAt: saved.confirmedAt.toISOString() },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "ConfirmDeliveryUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class ReleaseEscrowUseCase {
  constructor(
    private readonly repo: EscrowRepository,
    private readonly blockchain: MockBlockchainProvider,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: ReleaseEscrowCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const currentStatus = escrow.status as EscrowStatus;
    const newStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.RELEASED);

    const release = await this.blockchain.simulateRelease(escrow.contractAddress);

    escrow.status = newStatus;
    escrow.releaseTxHash = release.txHash;
    escrow.releasedAt = new Date();

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.RELEASED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { releaseTxHash: release.txHash, releasedAt: saved.releasedAt.toISOString() },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "ReleaseEscrowUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class RaiseDisputeUseCase {
  private readonly guards: EscrowGuard[] = [new DisputeGuard()];

  constructor(
    private readonly repo: EscrowRepository,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: RaiseDisputeCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const readModel = this.repo.toReadModel(escrow);
    for (const guard of this.guards) {
      const result = await guard.check(readModel, EscrowStatus.DISPUTED);
      if (!result.allowed) throw new BadRequestException(`Guard failed: ${result.reason}`);
    }

    const currentStatus = escrow.status as EscrowStatus;
    const newStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.DISPUTED);

    escrow.status = newStatus;
    escrow.disputed = true;
    escrow.disputedAt = new Date();
    escrow.disputeReason = cmd.reason;

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.DISPUTE_RAISED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { raisedBy: cmd.raisedBy, reason: cmd.reason, evidence: cmd.evidence },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "RaiseDisputeUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class ResolveDisputeUseCase {
  constructor(
    private readonly repo: EscrowRepository,
    private readonly blockchain: MockBlockchainProvider,
    private readonly disputeResolver: DisputeResolutionService,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: ResolveDisputeCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const currentStatus = escrow.status as EscrowStatus;
    const resolutionStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.RESOLVED);

    const resolutionResult = this.disputeResolver.resolve(
      {
        escrowId: escrow.id,
        orderId: escrow.orderId,
        buyerId: escrow.buyerId,
        producteurId: escrow.producteurId,
        amount: parseFloat(escrow.amount as any),
        reason: escrow.disputeReason || "",
        raisedBy: "",
      },
      cmd.resolution as DisputeResolution,
      cmd.adminId,
    );

    escrow.status = resolutionStatus;
    escrow.resolvedById = cmd.adminId;
    escrow.resolvedAt = new Date();
    escrow.resolution = cmd.resolution;

    if (cmd.resolution === DisputeResolution.REFUND_BUYER) {
      const refund = await this.blockchain.simulateRefund(escrow.contractAddress);
      escrow.refundTxHash = refund.txHash;
      escrow.status = EscrowStatus.REFUNDED;
    } else if (cmd.resolution === DisputeResolution.RELEASE_TO_SELLER) {
      const release = await this.blockchain.simulateRelease(escrow.contractAddress);
      escrow.releaseTxHash = release.txHash;
      escrow.status = EscrowStatus.RELEASED;
      escrow.releasedAt = new Date();
    }

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.DISPUTE_RESOLVED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { resolvedBy: cmd.adminId, resolution: cmd.resolution },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "ResolveDisputeUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class CancelEscrowUseCase {
  constructor(
    private readonly repo: EscrowRepository,
    private readonly eventBus: EscrowEventBus,
  ) {}

  async execute(cmd: CancelEscrowCommand): Promise<{ success: boolean; data: EscrowResponse }> {
    const escrow = await this.repo.findById(cmd.escrowId);

    const currentStatus = escrow.status as EscrowStatus;
    const newStatus = EscrowStateMachine.transition(currentStatus, EscrowStatus.CANCELLED);

    escrow.status = newStatus;

    const saved = await this.repo.save(escrow);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: EscrowDomainEventType.CANCELLED,
      aggregateId: saved.id as EscrowId,
      aggregateVersion: 1,
      payload: { reason: cmd.reason },
      traceId: crypto.randomUUID(),
      metadata: { timestamp: Date.now(), source: "CancelEscrowUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(e: Escrow): EscrowResponse {
    return {
      id: e.id, orderId: e.orderId, contractId: e.contractId,
      buyerId: e.buyerId, producteurId: e.producteurId,
      amount: parseFloat(e.amount as any), currency: e.currency,
      network: e.network, status: e.status,
      contractAddress: e.contractAddress,
      depositTxHash: e.depositTxHash, releaseTxHash: e.releaseTxHash,
      refundTxHash: e.refundTxHash,
      fundedAt: e.fundedAt?.toISOString() || null,
      deliveredAt: e.deliveredAt?.toISOString() || null,
      confirmedAt: e.confirmedAt?.toISOString() || null,
      releasedAt: e.releasedAt?.toISOString() || null,
      terms: e.terms, feePercentage: parseFloat(e.feePercentage as any),
      disputed: e.disputed,
      disputedAt: e.disputedAt?.toISOString() || null,
      disputeReason: e.disputeReason,
      resolution: e.resolution, resolvedAt: e.resolvedAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class GetEscrowStatsUseCase {
  constructor(private readonly repo: EscrowRepository) {}

  async execute(): Promise<{ success: boolean; data: EscrowStats }> {
    const stats = await this.repo.getStats();
    return { success: true, data: stats };
  }
}
