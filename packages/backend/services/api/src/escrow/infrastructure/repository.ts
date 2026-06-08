import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Escrow } from "../../entities/escrow.entity";
import { EscrowStatus, EscrowReadModel } from "../domain/types";

export interface EscrowFilter {
  buyerId?: string;
  producteurId?: string;
  status?: string;
  currency?: string;
  from?: string;
  to?: string;
  disputed?: boolean;
}

export interface EscrowStats {
  totalVolume: number;
  totalEscrows: number;
  activeEscrows: number;
  disputedCount: number;
  disputeRate: number;
  byStatus: { status: string; count: number; volume: number }[];
  today: { count: number; volume: number };
  avgFeePercentage: number;
}

@Injectable()
export class EscrowRepository {
  constructor(
    @InjectRepository(Escrow)
    private readonly repo: Repository<Escrow>,
  ) {}

  async save(escrow: Escrow): Promise<Escrow> {
    return this.repo.save(escrow);
  }

  async create(data: Partial<Escrow>): Promise<Escrow> {
    return this.repo.create(data);
  }

  async findById(id: string): Promise<Escrow> {
    const escrow = await this.repo.findOne({ where: { id } });
    if (!escrow) throw new NotFoundException(`Escrow ${id} not found`);
    return escrow;
  }

  async findByIdOrNull(id: string): Promise<Escrow | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Escrow>): Promise<void> {
    await this.repo.update(id, data);
  }

  async findWithFilter(filter: EscrowFilter): Promise<Escrow[]> {
    const qb = this.repo.createQueryBuilder("e");
    if (filter.buyerId) qb.andWhere("e.buyerId = :buyerId", { buyerId: filter.buyerId });
    if (filter.producteurId) qb.andWhere("e.producteurId = :producteurId", { producteurId: filter.producteurId });
    if (filter.status) qb.andWhere("e.status = :status", { status: filter.status });
    if (filter.currency) qb.andWhere("e.currency = :currency", { currency: filter.currency });
    if (filter.disputed !== undefined) qb.andWhere("e.disputed = :disputed", { disputed: filter.disputed });
    if (filter.from) qb.andWhere("e.createdAt >= :from", { from: new Date(filter.from) });
    if (filter.to) qb.andWhere("e.createdAt <= :to", { to: new Date(filter.to) });
    qb.orderBy("e.createdAt", "DESC");
    return qb.getMany();
  }

  async getStats(): Promise<EscrowStats> {
    const total = await this.repo
      .createQueryBuilder("e")
      .select("COALESCE(SUM(e.amount), 0)", "volume")
      .addSelect("COUNT(*)", "count")
      .addSelect("AVG(e.feePercentage)", "avgFee")
      .addSelect("SUM(CASE WHEN e.disputed = true THEN 1 ELSE 0 END)", "disputed")
      .addSelect("SUM(CASE WHEN e.status IN ('funded','delivered','confirmed') THEN 1 ELSE 0 END)", "active")
      .getRawOne();

    const byStatus = await this.repo
      .createQueryBuilder("e")
      .select("e.status", "status")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(e.amount), 0)", "volume")
      .groupBy("e.status")
      .getRawMany();

    const today = await this.repo
      .createQueryBuilder("e")
      .where("e.createdAt >= :today", { today: new Date().toISOString().split("T")[0] })
      .select("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(e.amount), 0)", "volume")
      .getRawOne();

    const totalCount = parseInt(total?.count || "0");
    const disputedCount = parseInt(total?.disputed || "0");

    return {
      totalVolume: parseFloat(total?.volume || "0"),
      totalEscrows: totalCount,
      activeEscrows: parseInt(total?.active || "0"),
      disputedCount,
      disputeRate: totalCount > 0 ? Math.round((disputedCount / totalCount) * 10000) / 100 : 0,
      byStatus: (byStatus || []).map(r => ({
        status: r.status,
        count: parseInt(r.count),
        volume: parseFloat(r.volume),
      })),
      today: {
        count: parseInt(today?.count || "0"),
        volume: parseFloat(today?.volume || "0"),
      },
      avgFeePercentage: parseFloat(total?.avgFee || "0"),
    };
  }

  toReadModel(escrow: Escrow): EscrowReadModel {
    return {
      id: escrow.id,
      orderId: escrow.orderId,
      buyerId: escrow.buyerId,
      producteurId: escrow.producteurId,
      amount: parseFloat(escrow.amount as any),
      currency: escrow.currency,
      network: escrow.network,
      status: escrow.status as EscrowStatus,
      disputed: escrow.disputed,
      feePercentage: parseFloat(escrow.feePercentage as any),
      contractAddress: escrow.contractAddress,
    };
  }
}
