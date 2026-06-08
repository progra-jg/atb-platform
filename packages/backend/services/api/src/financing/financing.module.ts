import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancingController } from "./presentation/controller";
import { CheckEligibility, ApplyForFinancing, ProcessRepayment, GetActiveContracts, GetContractById, CheckOverdueContracts } from "./application/usecases";
import { FinancingEventBus } from "./infrastructure/event-bus";
import { FinancingSeedService } from "./infrastructure/repository";
import { FinancingOfferEntity } from "../entities/financing-offer.entity";
import { FinancingContractEntity } from "../entities/financing-contract.entity";
import { FinancingRepaymentEntity } from "../entities/financing-repayment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FinancingOfferEntity, FinancingContractEntity, FinancingRepaymentEntity])],
  controllers: [FinancingController],
  providers: [CheckEligibility, ApplyForFinancing, ProcessRepayment, GetActiveContracts, GetContractById, CheckOverdueContracts, FinancingEventBus, FinancingSeedService],
  exports: [CheckOverdueContracts],
})
export class FinancingModule {}
