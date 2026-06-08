import { Controller, Get, Post, Param, Body, Query, Logger, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { InitiatePayoutUseCase, GetPayoutStatusUseCase, GetPayoutStatsUseCase, ListPayoutsUseCase } from "../application/usecases";
import { PayoutRepository } from "../infrastructure/repository";
import { PayoutMethodFactory } from "../domain/methods";
import { InitiatePayoutDto, PayoutFilterDto } from "./dto";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class PayoutController {
  private readonly logger = new Logger(PayoutController.name);

  constructor(
    private readonly initiatePayout: InitiatePayoutUseCase,
    private readonly getStatus: GetPayoutStatusUseCase,
    private readonly getStats: GetPayoutStatsUseCase,
    private readonly listUseCase: ListPayoutsUseCase,
    private readonly repo: PayoutRepository,
  ) {}

  @Get("payout/methods")
  getMethods(@Query("lang") lang?: string) {
    return { success: true, data: PayoutMethodFactory.getMethods(lang || "fr") };
  }

  @Post("payout/initiate")
  async initiate(@Body() dto: InitiatePayoutDto) {
    this.logger.log(`Initiate payout: payment=${dto.paymentId}, provider=${dto.provider}, amount=${dto.amount}, phone=${dto.phone}`);
    return this.initiatePayout.execute({
      paymentId: dto.paymentId,
      orderId: dto.orderId,
      producteurId: dto.producteurId,
      amount: dto.amount,
      currency: dto.currency,
      method: dto.method,
      provider: dto.provider,
      phone: dto.phone,
      idempotencyKey: dto.idempotencyKey,
    });
  }

  @Get("payout/:id")
  async getPayout(@Param("id") id: string) {
    const payout = await this.repo.findById(id);
    return { success: true, data: payout };
  }

  @Get("payouts")
  async listPayouts(@Query() filter: PayoutFilterDto) {
    return this.listUseCase.execute(filter);
  }

  @Get("payout/stats")
  async stats(@Query("producteurId") producteurId?: string) {
    return this.getStats.execute(producteurId);
  }

  @Post("payout/:id/check-status")
  async checkPayoutStatus(@Param("id") id: string) {
    return this.getStatus.execute(id);
  }
}
