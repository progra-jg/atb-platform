import { Controller, Get, Post, Param, Body, Query, Logger } from "@nestjs/common";
import {
  CreateEscrowUseCase, FundEscrowUseCase, MarkDeliveredUseCase,
  ConfirmDeliveryUseCase, ReleaseEscrowUseCase, RaiseDisputeUseCase,
  ResolveDisputeUseCase, CancelEscrowUseCase, GetEscrowStatsUseCase,
} from "../application/usecases";
import { EscrowRepository, EscrowFilter } from "../infrastructure/repository";
import {
  CreateEscrowDto, FundEscrowDto, MarkDeliveredDto,
  ConfirmDeliveryDto, ReleaseEscrowDto, RaiseDisputeDto,
  ResolveDisputeDto, CancelEscrowDto, EscrowFilterDto,
} from "./dto";

@Controller("api")
export class EscrowController {
  private readonly logger = new Logger(EscrowController.name);

  constructor(
    private readonly createEscrow: CreateEscrowUseCase,
    private readonly fundEscrow: FundEscrowUseCase,
    private readonly markDelivered: MarkDeliveredUseCase,
    private readonly confirmDelivery: ConfirmDeliveryUseCase,
    private readonly releaseEscrow: ReleaseEscrowUseCase,
    private readonly raiseDispute: RaiseDisputeUseCase,
    private readonly resolveDispute: ResolveDisputeUseCase,
    private readonly cancelEscrow: CancelEscrowUseCase,
    private readonly getStats: GetEscrowStatsUseCase,
    private readonly repo: EscrowRepository,
  ) {}

  @Post("escrow")
  async create(@Body() dto: CreateEscrowDto) {
    this.logger.log(`Create escrow: order=${dto.orderId}, buyer=${dto.buyerId}, amount=${dto.amount}`);
    return this.createEscrow.execute({
      orderId: dto.orderId,
      buyerId: dto.buyerId,
      producteurId: dto.producteurId,
      amount: dto.amount,
      currency: dto.currency,
      network: dto.network,
      terms: dto.terms,
      feePercentage: dto.feePercentage,
    });
  }

  @Post("escrow/:id/fund")
  async fund(@Param("id") id: string, @Body() dto: FundEscrowDto) {
    this.logger.log(`Fund escrow ${id}`);
    return this.fundEscrow.execute({ escrowId: id, buyerId: dto.buyerId });
  }

  @Post("escrow/:id/deliver")
  async deliver(@Param("id") id: string, @Body() dto: MarkDeliveredDto) {
    this.logger.log(`Mark escrow ${id} as delivered`);
    return this.markDelivered.execute({ escrowId: id, producteurId: dto.producteurId, producteurSignature: dto.producteurSignature });
  }

  @Post("escrow/:id/confirm")
  async confirm(@Param("id") id: string, @Body() dto: ConfirmDeliveryDto) {
    this.logger.log(`Confirm delivery for escrow ${id}`);
    return this.confirmDelivery.execute({ escrowId: id, buyerId: dto.buyerId, buyerSignature: dto.buyerSignature });
  }

  @Post("escrow/:id/release")
  async release(@Param("id") id: string, @Body() dto: ReleaseEscrowDto) {
    this.logger.log(`Release escrow ${id}`);
    return this.releaseEscrow.execute({ escrowId: id, adminId: dto.adminId });
  }

  @Post("escrow/:id/dispute")
  async dispute(@Param("id") id: string, @Body() dto: RaiseDisputeDto) {
    this.logger.log(`Raise dispute on escrow ${id}: ${dto.reason}`);
    return this.raiseDispute.execute({ escrowId: id, raisedBy: dto.raisedBy, reason: dto.reason, evidence: dto.evidence });
  }

  @Post("escrow/:id/resolve")
  async resolve(@Param("id") id: string, @Body() dto: ResolveDisputeDto) {
    this.logger.log(`Resolve dispute on escrow ${id}: ${dto.resolution}`);
    return this.resolveDispute.execute({ escrowId: id, adminId: dto.adminId, resolution: dto.resolution });
  }

  @Post("escrow/:id/cancel")
  async cancel(@Param("id") id: string, @Body() dto: CancelEscrowDto) {
    this.logger.log(`Cancel escrow ${id}`);
    return this.cancelEscrow.execute({ escrowId: id, buyerId: dto.buyerId, reason: dto.reason });
  }

  @Get("escrow/:id")
  async getEscrow(@Param("id") id: string) {
    const escrow = await this.repo.findById(id);
    return { success: true, data: this.toResponse(escrow) };
  }

  @Get("escrows")
  async listEscrows(@Query() filter: EscrowFilterDto) {
    const escrows = await this.repo.findWithFilter(filter as EscrowFilter);
    return { success: true, data: escrows.map(e => this.toResponse(e)) };
  }

  @Get("escrow/stats")
  async stats() {
    return this.getStats.execute();
  }

  private toResponse(e: any) {
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
      archived: e.archived,
      createdAt: e.createdAt?.toISOString(),
      updatedAt: e.updatedAt?.toISOString(),
    };
  }
}
