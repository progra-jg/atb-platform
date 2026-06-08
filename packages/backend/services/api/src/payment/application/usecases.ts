import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Payment } from "../../entities/payment.entity";
import {
  PaymentStatus, PaymentMethod, PaymentProviderId,
  PaymentId, TraceId, PaymentDomainEventType,
  PaymentStateMachine, AmountGuard, TransitionGuard, PaymentReadModel,
} from "../domain/types";
import { PaymentMethodFactory } from "../domain/methods";
import { PaymentRepository, PaymentStats } from "../infrastructure/repository";
import { PaymentProviderRegistry } from "../infrastructure/providers";
import { PaymentEventBus } from "../infrastructure/event-bus";
import { WebhookVerifierService } from "../infrastructure/webhook";
import { IdempotencyService } from "../infrastructure/idempotency";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "../../entities/order.entity";
import { Lot } from "../../entities/lot.entity";

export interface InitiatePaymentCommand {
  orderId: string;
  contractId?: string;
  buyerId?: string;
  producteurId?: string;
  amount: number;
  currency?: string;
  method: string;
  provider: string;
  idempotencyKey?: string;
  phone?: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  contractId?: string;
  buyerId: string;
  producteurId?: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  providerRef?: string;
  status: string;
  statusMessage?: string;
  paidAt?: string;
  paymentUrl?: string;
  qrCode?: string;
  invoiceNumber?: string;
  verifiedByAdmin: boolean;
  bankDetails?: Record<string, string>;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class InitiatePaymentUseCase {
  private readonly logger = new Logger(InitiatePaymentUseCase.name);
  private readonly guards: TransitionGuard[] = [new AmountGuard()];

  constructor(
    private readonly repo: PaymentRepository,
    private readonly providers: PaymentProviderRegistry,
    private readonly eventBus: PaymentEventBus,
    private readonly idempotency: IdempotencyService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Lot) private readonly lotRepo: Repository<Lot>,
  ) {}

  async execute(cmd: InitiatePaymentCommand): Promise<{ success: boolean; data: PaymentResponse }> {
    if (cmd.idempotencyKey) {
      const cached = this.idempotency.getKey(cmd.idempotencyKey);
      if (cached) {
        return cached.responseBody as { success: boolean; data: PaymentResponse };
      }
    }

    const method = cmd.method as PaymentMethod;
    const provider = cmd.provider as PaymentProviderId;
    PaymentMethodFactory.validateAmount(method, provider, cmd.amount);

    const payment = await this.repo.create({
      id: crypto.randomUUID(),
      orderId: cmd.orderId,
      contractId: cmd.contractId || null,
      buyerId: cmd.buyerId || "guest",
      producteurId: cmd.producteurId || null,
      amount: cmd.amount,
      currency: cmd.currency || "XOF",
      method: cmd.method,
      provider: cmd.provider,
      status: PaymentStatus.PENDING,
    });

    const readModel: PaymentReadModel = this.repo.toReadModel(payment);
    for (const guard of this.guards) {
      const result = await guard.check(readModel, PaymentStatus.PROCESSING);
      if (!result.allowed) throw new BadRequestException(`Guard failed: ${result.reason}`);
    }

    payment.status = PaymentStateMachine.transition(payment.status as PaymentStatus, PaymentStatus.PROCESSING);

    const providerImpl = this.providers.get(provider);
    const providerResult = await providerImpl.initiate(cmd.amount, cmd.currency || "XOF", payment.id as PaymentId, { phone: cmd.phone });

    if (providerResult.paymentUrl) payment.paymentUrl = providerResult.paymentUrl;
    if (providerResult.providerRef) payment.providerRef = providerResult.providerRef;
    if (providerResult.qrCode) payment.qrCode = providerResult.qrCode;
    if (providerResult.invoiceNumber) payment.invoiceNumber = providerResult.invoiceNumber;

    if (!providerResult.paymentUrl) {
      payment.status = PaymentStatus.PROCESSING;
    }

    const saved = await this.repo.save(payment);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: PaymentDomainEventType.INITIATED,
      aggregateId: payment.id as PaymentId,
      aggregateVersion: 1,
      payload: { orderId: cmd.orderId, buyerId: cmd.buyerId, amount: cmd.amount, currency: cmd.currency || "XOF", method: cmd.method, provider: cmd.provider },
      traceId: cmd.idempotencyKey as TraceId || crypto.randomUUID() as TraceId,
      metadata: { timestamp: Date.now(), source: "InitiatePaymentUseCase" },
    });

    const response = this.toResponse(saved);
    if (method === PaymentMethod.BANK_TRANSFER) {
      response.bankDetails = PaymentMethodFactory.getBankDetails();
    }
    if (method === PaymentMethod.CRYPTO) {
      const wallets = PaymentMethodFactory.getCryptoWallets();
      response.walletAddress = wallets[provider]?.address;
    }

    if (cmd.idempotencyKey) {
      this.idempotency.setKey(cmd.idempotencyKey, {
        key: cmd.idempotencyKey,
        statusCode: 200,
        responseBody: { success: true, data: response },
        createdAt: new Date(),
      });
    }

    return { success: true, data: response };
  }

  private toResponse(p: Payment): PaymentResponse {
    return {
      id: p.id, orderId: p.orderId, contractId: p.contractId,
      buyerId: p.buyerId, producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      paidAt: p.paidAt?.toISOString() || null,
      paymentUrl: p.paymentUrl, qrCode: p.qrCode,
      invoiceNumber: p.invoiceNumber,
      verifiedByAdmin: p.verifiedByAdmin,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class HandleWebhookUseCase {
  private readonly logger = new Logger(HandleWebhookUseCase.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly webhookVerifier: WebhookVerifierService,
    private readonly eventBus: PaymentEventBus,
    private readonly idempotency: IdempotencyService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Lot) private readonly lotRepo: Repository<Lot>,
  ) {}

  async execute(provider: string, rawPayload: Record<string, unknown>, headers: Record<string, string>): Promise<{ success: boolean; data: PaymentResponse }> {
    const verificationResult = this.webhookVerifier.verify(provider, {
      raw: rawPayload,
      signature: headers["x-webhook-signature"] || headers["x-signature"] || "",
      timestamp: headers["x-timestamp"],
      nonce: headers["x-nonce"],
    });

    if (!verificationResult.valid) {
      throw new BadRequestException(`Webhook verification failed: ${verificationResult.reason}`);
    }

    if (!this.webhookVerifier.checkReplay({ raw: rawPayload, signature: headers["x-webhook-signature"] || "", timestamp: headers["x-timestamp"] })) {
      throw new BadRequestException("Webhook replay detected");
    }

    const paymentId = verificationResult.paymentId || (rawPayload as any).payment_id || (rawPayload as any).data?.payment?.id;
    if (!paymentId) throw new BadRequestException("Payment ID not found in webhook payload");

    const eventType = verificationResult.eventType || (rawPayload as any).status || (rawPayload as any).event_type;
    const idempotencyKey = `webhook:${provider}:${paymentId}:${eventType}`;

    const cached = this.idempotency.getKey(idempotencyKey);
    if (cached) {
      return cached.responseBody as { success: boolean; data: PaymentResponse };
    }

    const payment = await this.repo.findById(paymentId);

    let newStatus = this.mapWebhookEvent(eventType, rawPayload);

    const currentStatus = payment.status as PaymentStatus;
    if (!PaymentStateMachine.canTransition(currentStatus, newStatus)) {
      this.logger.warn(`Ignoring webhook: invalid transition ${currentStatus} → ${newStatus} for payment ${paymentId}`);
      return { success: true, data: this.toResponse(payment) };
    }

    payment.status = PaymentStateMachine.transition(currentStatus, newStatus);
    payment.providerRef = verificationResult.paymentId || (rawPayload as any).transaction_id || payment.providerRef;
    payment.providerData = JSON.stringify(rawPayload);
    payment.webhookReceivedAt = new Date();
    if (newStatus === PaymentStatus.COMPLETED) {
      payment.paidAt = new Date();
    }

    const saved = await this.repo.save(payment);

    if (newStatus === PaymentStatus.COMPLETED) {
      await this.orderRepo.update(payment.orderId, { status: "confirmed", paymentReference: payment.id });
      const order = await this.orderRepo.findOne({ where: { id: payment.orderId } });
      if (order?.producteurId) {
        await this.lotRepo.update({ producteurId: order.producteurId }, { statut: "Vendu" } as any);
      }
    }

    const domainEventType = {
      [PaymentStatus.COMPLETED]: PaymentDomainEventType.COMPLETED,
      [PaymentStatus.FAILED]: PaymentDomainEventType.FAILED,
      [PaymentStatus.REFUNDED]: PaymentDomainEventType.REFUNDED,
    }[newStatus] || PaymentDomainEventType.WEBHOOK_RECEIVED;

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: domainEventType,
      aggregateId: payment.id as PaymentId,
      aggregateVersion: 1,
      payload: { providerRef: payment.providerRef, status: newStatus, webhookEvent: eventType },
      traceId: crypto.randomUUID() as TraceId,
      metadata: { timestamp: Date.now(), source: "HandleWebhookUseCase" },
    });

    this.idempotency.setKey(idempotencyKey, {
      key: idempotencyKey,
      statusCode: 200,
      responseBody: { success: true, data: this.toResponse(saved) },
      createdAt: new Date(),
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private mapWebhookEvent(eventType: string, payload: Record<string, unknown>): PaymentStatus {
    const lower = eventType.toLowerCase();

    if (["completed", "success", "payment.completed", "payment.succeeded", "charge.completed", "transaction.approved"].includes(lower)) {
      return PaymentStatus.COMPLETED;
    }
    if (["failed", "payment.failed", "cancelled", "payment.cancelled", "charge.failed", "transaction.declined"].includes(lower)) {
      return PaymentStatus.FAILED;
    }
    if (["refunded", "payment.refunded", "transaction.refunded"].includes(lower)) {
      return PaymentStatus.REFUNDED;
    }
    if (["pending", "payment.pending", "processing", "waiting_for_customer"].includes(lower)) {
      return PaymentStatus.PROCESSING;
    }
    if (["expired", "payment.expired", "timeout"].includes(lower)) {
      return PaymentStatus.FAILED;
    }

    return PaymentStatus.PROCESSING;
  }

  private toResponse(p: Payment): PaymentResponse {
    return {
      id: p.id, orderId: p.orderId, contractId: p.contractId,
      buyerId: p.buyerId, producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      paidAt: p.paidAt?.toISOString() || null,
      paymentUrl: p.paymentUrl, qrCode: p.qrCode,
      invoiceNumber: p.invoiceNumber,
      verifiedByAdmin: p.verifiedByAdmin,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class VerifyBankTransferUseCase {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly eventBus: PaymentEventBus,
  ) {}

  async execute(paymentId: string, adminId: string): Promise<{ success: boolean; data: PaymentResponse }> {
    const payment = await this.repo.findById(paymentId);
    if (payment.method !== "bank_transfer") {
      throw new BadRequestException("Only bank transfers can be verified manually");
    }

    const currentStatus = payment.status as PaymentStatus;
    if (!PaymentStateMachine.canTransition(currentStatus, PaymentStatus.COMPLETED)) {
      throw new BadRequestException(`Cannot verify payment in status ${currentStatus}`);
    }

    payment.status = PaymentStateMachine.transition(currentStatus, PaymentStatus.COMPLETED);
    payment.verifiedByAdmin = true;
    payment.verifiedById = adminId;
    payment.paidAt = new Date();

    const saved = await this.repo.save(payment);

    await this.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventType: PaymentDomainEventType.VERIFIED_BY_ADMIN,
      aggregateId: payment.id as PaymentId,
      aggregateVersion: 1,
      payload: { adminId, verifiedAt: new Date().toISOString() },
      traceId: crypto.randomUUID() as TraceId,
      metadata: { timestamp: Date.now(), source: "VerifyBankTransferUseCase" },
    });

    return { success: true, data: this.toResponse(saved) };
  }

  private toResponse(p: Payment): PaymentResponse {
    return {
      id: p.id, orderId: p.orderId, contractId: p.contractId,
      buyerId: p.buyerId, producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      paidAt: p.paidAt?.toISOString() || null,
      paymentUrl: p.paymentUrl, qrCode: p.qrCode,
      invoiceNumber: p.invoiceNumber,
      verifiedByAdmin: p.verifiedByAdmin,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class CheckPaymentStatusUseCase {
  private readonly logger = new Logger(CheckPaymentStatusUseCase.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly providers: PaymentProviderRegistry,
    private readonly eventBus: PaymentEventBus,
  ) {}

  async execute(paymentId: string): Promise<{ success: boolean; data: PaymentResponse }> {
    const payment = await this.repo.findById(paymentId);

    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.FAILED || payment.status === PaymentStatus.REFUNDED) {
      return { success: true, data: this.toResponse(payment) };
    }

    if (payment.providerRef) {
      const providerId = payment.provider as PaymentProviderId;
      try {
        const providerImpl = this.providers.get(providerId);
        const statusResult = await providerImpl.checkStatus(payment.providerRef);
        const currentStatus = payment.status as PaymentStatus;

        if (statusResult.status !== currentStatus && PaymentStateMachine.canTransition(currentStatus, statusResult.status)) {
          payment.status = PaymentStateMachine.transition(currentStatus, statusResult.status);
          if (statusResult.status === PaymentStatus.COMPLETED) {
            payment.paidAt = new Date();
          }
          const saved = await this.repo.save(payment);

          await this.eventBus.publish({
            eventId: crypto.randomUUID(),
            eventType: statusResult.status === PaymentStatus.COMPLETED
              ? PaymentDomainEventType.COMPLETED
              : PaymentDomainEventType.FAILED,
            aggregateId: payment.id as PaymentId,
            aggregateVersion: 1,
            payload: { providerRef: payment.providerRef, status: statusResult.status },
            traceId: crypto.randomUUID() as TraceId,
            metadata: { timestamp: Date.now(), source: "CheckPaymentStatusUseCase" },
          });

          return { success: true, data: this.toResponse(saved) };
        }
      } catch (err) {
        this.logger.warn(`Status check failed for payment ${paymentId}: ${err.message}`);
      }
    }

    return { success: true, data: this.toResponse(payment) };
  }

  private toResponse(p: Payment): PaymentResponse {
    return {
      id: p.id, orderId: p.orderId, contractId: p.contractId,
      buyerId: p.buyerId, producteurId: p.producteurId,
      amount: parseFloat(p.amount as any), currency: p.currency,
      method: p.method, provider: p.provider,
      providerRef: p.providerRef, status: p.status,
      statusMessage: p.statusMessage,
      paidAt: p.paidAt?.toISOString() || null,
      paymentUrl: p.paymentUrl, qrCode: p.qrCode,
      invoiceNumber: p.invoiceNumber,
      verifiedByAdmin: p.verifiedByAdmin,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class GetPaymentStatsUseCase {
  constructor(private readonly repo: PaymentRepository) {}

  async execute(): Promise<{ success: boolean; data: PaymentStats }> {
    const stats = await this.repo.getStats();
    return { success: true, data: stats };
  }
}
