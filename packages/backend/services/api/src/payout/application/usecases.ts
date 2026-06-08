import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payout } from "../../entities/payout.entity";
import { Payment } from "../../entities/payment.entity";
import {
  PayoutStatus, PayoutMethod, PayoutProviderId,
  PayoutId, PayoutTraceId, PayoutDomainEventType,
  PayoutStateMachine, PayoutReadModel,
} from "../domain/types";
import { PayoutMethodFactory } from "../domain/methods";
import { PayoutRepository, PayoutStats } from "../infrastructure/repository";
import { PayoutProviderRegistry } from "../infrastructure/providers";
import { PayoutEventBus } from "../infrastructure/event-bus";

export interface InitiatePayoutCommand {
  paymentId: string;
  orderId: string;
  producteurId: string;
  amount: number;
  currency?: string;
  method: string;
  provider: string;
  phone: string;
  idempotencyKey?: string;
}

export interface PayoutResponse {
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
  status: string;
  statusMessage?: string;
  completedAt?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class InitiatePayoutUseCase {
  private readonly logger = new Logger(InitiatePayoutUseCase.name);

  constructor(
    private readonly repo: PayoutRepository,
    private readonly providers: PayoutProviderRegistry,
    private readonly eventBus: PayoutEventBus,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
  ) {}

  async execute(cmd: InitiatePayoutCommand): Promise<{ success: boolean; data: PayoutResponse }> {
    if (!cmd.phone) throw new BadRequestException("Phone number is required for mobile money payout");

    const method = cmd.method as PayoutMethod;
    const provider = cmd.provider as PayoutProviderId;
    PayoutMethodFactory.validateAmount(method, provider, cmd.amount);

    const payment = await this.paymentRepo.findOne({ where: { id: cmd.paymentId } });
    if (!payment) throw new BadRequestException(`Payment ${cmd.paymentId} not found`);
    if (payment.status !== "completed") throw new BadRequestException("Payment must be completed before payout");

    const payout = await this.repo.create({
      id: crypto.randomUUID(),
      paymentId: cmd.paymentId,
      orderId: cmd.orderId,
      producteurId: cmd.producteurId,
      amount: cmd.amount,
      currency: cmd.currency || "XOF",
      method: cmd.method,
      provider: cmd.provider,
      phone: cmd.phone,
      status: PayoutStatus.PENDING,
      idempotencyKey: cmd.idempotencyKey || null,
    });

    const readModel = this.repo.toReadModel(payout);
    payout.status = PayoutStateMachine.transition(readModel.status, PayoutStatus.PROCESSING);

    const providerImpl = this.providers.get(provider);
    const providerResult = await providerImpl.disburse(
      cmd.amount,
      cmd.currency || "XOF",
      cmd.phone,
      payout.id as PayoutId,
    );

    if (providerResult.providerRef) payout.providerRef = providerResult.providerRef;

    if (providerResult.status === PayoutStatus.COMPLETED) {
      payout.status = PayoutStatus.COMPLETED;
      payout.completedAt = new Date();
    } else if (providerResult.status === PayoutStatus.FAILED) {
      payout.status = PayoutStatus.FAILED;
      payout.failedAt = new Date();
      payout.failureReason = "Provider returned failure";
    }

    const saved = await this.repo.save(payout);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: saved.status === PayoutStatus.COMPLETED
        ? PayoutDomainEventType.COMPLETED
        : PayoutDomainEventType.INITIATED,
      aggregateId: payout.id as PayoutId,
      aggregateVersion: 1,
      payload: {
        paymentId: cmd.paymentId,
        producteurId: cmd.producteurId,
        amount: cmd.amount,
        currency: cmd.currency || "XOF",
        method: cmd.method,
        provider: cmd.provider,
        phone: cmd.phone,
      },
      traceId: cmd.idempotencyKey as PayoutTraceId || crypto.randomUUID() as PayoutTraceId,
      metadata: { timestamp: Date.now(), source: "InitiatePayoutUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(p: Payout): PayoutResponse {
    return {
      id: p.id,
      paymentId: p.paymentId,
      orderId: p.orderId,
      producteurId: p.producteurId,
      amount: parseFloat(p.amount as any),
      currency: p.currency,
      method: p.method,
      provider: p.provider,
      phone: p.phone,
      providerRef: p.providerRef,
      status: p.status,
      statusMessage: p.statusMessage,
      completedAt: p.completedAt?.toISOString() || null,
      failureReason: p.failureReason,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class GetPayoutStatusUseCase {
  private readonly logger = new Logger(GetPayoutStatusUseCase.name);

  constructor(
    private readonly repo: PayoutRepository,
    private readonly providers: PayoutProviderRegistry,
    private readonly eventBus: PayoutEventBus,
  ) {}

  async execute(payoutId: string): Promise<{ success: boolean; data: PayoutResponse }> {
    const payout = await this.repo.findById(payoutId);

    if (payout.status === PayoutStatus.COMPLETED || payout.status === PayoutStatus.FAILED) {
      return { success: true, data: this.toResponse(payout) };
    }

    if (payout.providerRef) {
      const providerId = payout.provider as PayoutProviderId;
      try {
        const providerImpl = this.providers.get(providerId);
        const statusResult = await providerImpl.checkStatus(payout.providerRef);
        const currentStatus = payout.status as PayoutStatus;

        if (statusResult.status !== currentStatus && PayoutStateMachine.canTransition(currentStatus, statusResult.status)) {
          payout.status = PayoutStateMachine.transition(currentStatus, statusResult.status);
          if (statusResult.status === PayoutStatus.COMPLETED) payout.completedAt = new Date();
          if (statusResult.status === PayoutStatus.FAILED) { payout.failedAt = new Date(); payout.failureReason = "Provider status check failed"; }
          const saved = await this.repo.save(payout);
          return { success: true, data: this.toResponse(saved) };
        }
      } catch (err) {
        this.logger.warn(`Payout status check failed for ${payoutId}: ${err.message}`);
      }
    }

    return { success: true, data: this.toResponse(payout) };
  }

  private toResponse(p: Payout): PayoutResponse {
    return {
      id: p.id, paymentId: p.paymentId, orderId: p.orderId,
      producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider, phone: p.phone,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      completedAt: p.completedAt?.toISOString() || null,
      failureReason: p.failureReason,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class GetPayoutStatsUseCase {
  constructor(private readonly repo: PayoutRepository) {}

  async execute(producteurId?: string): Promise<{ success: boolean; data: PayoutStats }> {
    const stats = await this.repo.getStats(producteurId);
    return { success: true, data: stats };
  }
}

@Injectable()
export class ListPayoutsUseCase {
  constructor(private readonly repo: PayoutRepository) {}

  async execute(filter: { producteurId?: string; status?: string; from?: string; to?: string }): Promise<{ success: boolean; data: PayoutResponse[] }> {
    const payouts = await this.repo.findWithFilter(filter);
    return { success: true, data: payouts.map(p => ({
      id: p.id, paymentId: p.paymentId, orderId: p.orderId,
      producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider, phone: p.phone,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      completedAt: p.completedAt?.toISOString() || null,
      failureReason: p.failureReason,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })) };
  }
}
