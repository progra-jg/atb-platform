import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Payout } from "../../entities/payout.entity";
import { PayoutStatus, PayoutReadModel } from "../domain/types";

export interface PayoutFilter {
  producteurId?: string;
  paymentId?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface PayoutStats {
  totalDisbursed: number;
  totalTransactions: number;
  successRate: number;
  byProvider: { provider: string; count: number; volume: number }[];
  today: { count: number; volume: number };
  pendingCount: number;
}

@Injectable()
export class PayoutRepository {
  constructor(
    @InjectRepository(Payout)
    private readonly repo: Repository<Payout>,
  ) {}

  async save(payout: Payout): Promise<Payout> {
    return this.repo.save(payout);
  }

  async create(data: Partial<Payout>): Promise<Payout> {
    return this.repo.create(data);
  }

  async findById(id: string): Promise<Payout> {
    const payout = await this.repo.findOne({ where: { id } });
    if (!payout) throw new NotFoundException(`Payout ${id} not found`);
    return payout;
  }

  async findByIdOrNull(id: string): Promise<Payout | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findWithFilter(filter: PayoutFilter): Promise<Payout[]> {
    const qb = this.repo.createQueryBuilder("p");
    if (filter.producteurId) qb.andWhere("p.producteurId = :producteurId", { producteurId: filter.producteurId });
    if (filter.paymentId) qb.andWhere("p.paymentId = :paymentId", { paymentId: filter.paymentId });
    if (filter.status) qb.andWhere("p.status = :status", { status: filter.status });
    if (filter.from) qb.andWhere("p.createdAt >= :from", { from: new Date(filter.from) });
    if (filter.to) qb.andWhere("p.createdAt <= :to", { to: new Date(filter.to) });
    qb.orderBy("p.createdAt", "DESC");
    return qb.getMany();
  }

  async getStats(producteurId?: string): Promise<PayoutStats> {
    const qb = this.repo.createQueryBuilder("p");
    if (producteurId) qb.where("p.producteurId = :producteurId", { producteurId });

    const total = await qb
      .clone()
      .select("COALESCE(SUM(p.amount), 0)", "volume")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END)", "success")
      .getRawOne();

    const byProvider = await qb
      .clone()
      .select("p.provider", "provider")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(p.amount), 0)", "volume")
      .groupBy("p.provider")
      .getRawMany();

    const today = await qb
      .clone()
      .where("p.createdAt >= :today", { today: new Date().toISOString().split("T")[0] })
      .select("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(p.amount), 0)", "volume")
      .getRawOne();

    const totalCount = parseInt(total?.count || "0");
    const successCount = parseInt(total?.success || "0");

    return {
      totalDisbursed: parseFloat(total?.volume || "0"),
      totalTransactions: totalCount,
      successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 10000) / 100 : 0,
      byProvider: (byProvider || []).map(r => ({
        provider: r.provider,
        count: parseInt(r.count),
        volume: parseFloat(r.volume),
      })),
      today: {
        count: parseInt(today?.count || "0"),
        volume: parseFloat(today?.volume || "0"),
      },
      pendingCount: await qb.clone().andWhere("p.status = 'pending'").getCount(),
    };
  }

  toReadModel(payout: Payout): PayoutReadModel {
    return {
      id: payout.id,
      paymentId: payout.paymentId,
      amount: parseFloat(payout.amount as any),
      currency: payout.currency,
      method: payout.method,
      provider: payout.provider,
      status: payout.status as PayoutStatus,
      producteurId: payout.producteurId,
      phone: payout.phone,
    };
  }
}
