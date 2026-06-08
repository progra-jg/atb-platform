import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payment } from "../entities/payment.entity";
import { Order } from "../entities/order.entity";
import { Lot } from "../entities/lot.entity";
import { OutboxEvent } from "../entities/payment.entity";

import { PaymentController } from "./presentation/controller";
import { PaymentRepository } from "./infrastructure/repository";
import { PaymentEventBus } from "./infrastructure/event-bus";
import { CircuitBreakerService } from "./infrastructure/circuit-breaker";
import { WebhookVerifierService } from "./infrastructure/webhook";
import { PaymentProviderRegistry } from "./infrastructure/providers";
import { InvoiceService } from "./infrastructure/invoice.service";
import { IdempotencyService } from "./infrastructure/idempotency";
import { InitiatePaymentUseCase, HandleWebhookUseCase, VerifyBankTransferUseCase, CheckPaymentStatusUseCase, GetPaymentStatsUseCase } from "./application/usecases";

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order, Lot, OutboxEvent]), HttpModule],
  controllers: [PaymentController],
  providers: [
    PaymentRepository,
    PaymentEventBus,
    CircuitBreakerService,
    WebhookVerifierService,
    PaymentProviderRegistry,
    IdempotencyService,
    InvoiceService,
    InitiatePaymentUseCase,
    HandleWebhookUseCase,
    VerifyBankTransferUseCase,
    CheckPaymentStatusUseCase,
    GetPaymentStatsUseCase,
  ],
  exports: [PaymentRepository, PaymentEventBus],
})
export class PaymentModule {}
