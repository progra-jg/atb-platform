import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Escrow } from "../entities/escrow.entity";
import { OutboxEvent } from "../entities/payment.entity";

import { EscrowController } from "./presentation/controller";
import { EscrowRepository } from "./infrastructure/repository";
import { EscrowEventBus } from "./infrastructure/event-bus";
import { MockBlockchainProvider } from "./infrastructure/blockchain";
import { DisputeResolutionService } from "./infrastructure/dispute";
import {
  CreateEscrowUseCase, FundEscrowUseCase, MarkDeliveredUseCase,
  ConfirmDeliveryUseCase, ReleaseEscrowUseCase, RaiseDisputeUseCase,
  ResolveDisputeUseCase, CancelEscrowUseCase, GetEscrowStatsUseCase,
} from "./application/usecases";

@Module({
  imports: [TypeOrmModule.forFeature([Escrow, OutboxEvent])],
  controllers: [EscrowController],
  providers: [
    EscrowRepository,
    EscrowEventBus,
    MockBlockchainProvider,
    DisputeResolutionService,
    CreateEscrowUseCase,
    FundEscrowUseCase,
    MarkDeliveredUseCase,
    ConfirmDeliveryUseCase,
    ReleaseEscrowUseCase,
    RaiseDisputeUseCase,
    ResolveDisputeUseCase,
    CancelEscrowUseCase,
    GetEscrowStatsUseCase,
  ],
  exports: [EscrowRepository, EscrowEventBus],
})
export class EscrowModule {}
