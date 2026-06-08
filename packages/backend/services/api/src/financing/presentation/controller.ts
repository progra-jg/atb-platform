import { Controller, Post, Get, Param, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../guards/jwt-auth.guard";
import { CheckEligibility, ApplyForFinancing, ProcessRepayment, GetActiveContracts, GetContractById } from "../application/usecases";
import { ApplyForFinancingDto, RepayFinancingDto, CheckEligibilityQuery } from "./dto";

@Controller("financing")
@UseGuards(JwtAuthGuard)
export class FinancingController {
  constructor(
    private checkEligibility: CheckEligibility,
    private applyForFinancing: ApplyForFinancing,
    private processRepayment: ProcessRepayment,
    private getActiveContracts: GetActiveContracts,
    private getContractById: GetContractById,
  ) {}

  @Get("eligibility")
  async eligibility(@Query() query: CheckEligibilityQuery) {
    return this.checkEligibility.execute(query.producteurId, query.trustScore);
  }

  @Post("apply")
  async apply(@Body() dto: ApplyForFinancingDto, @Query("producteurId") producteurId: string, @Query("trustScore") trustScore: string) {
    return this.applyForFinancing.execute(producteurId, dto.offerId, dto.amount, Number(trustScore), dto.collateralType, dto.collateralRef);
  }

  @Post(":id/repay")
  async repay(@Param("id") id: string, @Body() dto: RepayFinancingDto) {
    return this.processRepayment.execute(id, dto.amount, dto.transactionRef);
  }

  @Get("active/:producteurId")
  async activeContracts(@Param("producteurId") producteurId: string) {
    return this.getActiveContracts.execute(producteurId);
  }

  @Get(":id")
  async getContract(@Param("id") id: string) {
    return this.getContractById.execute(id);
  }
}
