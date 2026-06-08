import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Payout } from "../entities/payout.entity";
import { Payment } from "../entities/payment.entity";
import { Order } from "../entities/order.entity";
import { OutboxEvent } from "../entities/payment.entity";

import { PayoutController } from "./presentation/controller";
import { PayoutRepository } from "./infrastructure/repository";
import { PayoutEventBus } from "./infrastructure/event-bus";
import { PayoutProviderRegistry } from "./infrastructure/providers";
import { InitiatePayoutUseCase, GetPayoutStatusUseCase, GetPayoutStatsUseCase, ListPayoutsUseCase } from "./application/usecases";

@Module({
  imports: [TypeOrmModule.forFeature([Payout, Payment, Order, OutboxEvent]), HttpModule],
  controllers: [PayoutController],
  providers: [
    PayoutRepository,
    PayoutEventBus,
    PayoutProviderRegistry,
    InitiatePayoutUseCase,
    GetPayoutStatusUseCase,
    GetPayoutStatsUseCase,
    ListPayoutsUseCase,
  ],
  exports: [PayoutRepository, PayoutEventBus],
})
export class PayoutModule {}
