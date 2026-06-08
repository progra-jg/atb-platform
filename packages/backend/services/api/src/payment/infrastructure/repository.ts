import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere } from "typeorm";
import { Payment } from "../../entities/payment.entity";
import { PaymentStatus, PaymentId, TraceId, PaymentReadModel } from "../domain/types";

export interface PaymentFilter {
  buyerId?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  producteurId?: string;
}

export interface PaymentStats {
  totalVolume: number;
  totalTransactions: number;
  successRate: number;
  byMethod: { method: string; count: number; volume: number }[];
  today: { count: number; volume: number };
  pendingVerification: number;
}

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    return this.repo.save(payment);
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    return this.repo.create(data);
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    return payment;
  }

  async findByIdOrNull(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Payment>): Promise<void> {
    await this.repo.update(id, data);
  }

  async findWithFilter(filter: PaymentFilter): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {};
    if (filter.buyerId) where.buyerId = filter.buyerId;
    if (filter.status) where.status = filter.status;
    if (filter.method) where.method = filter.method;
    if (filter.producteurId) where.producteurId = filter.producteurId;

    const qb = this.repo.createQueryBuilder("p");
    if (filter.buyerId) qb.andWhere("p.buyerId = :buyerId", { buyerId: filter.buyerId });
    if (filter.status) qb.andWhere("p.status = :status", { status: filter.status });
    if (filter.method) qb.andWhere("p.method = :method", { method: filter.method });
    if (filter.producteurId) qb.andWhere("p.producteurId = :producteurId", { producteurId: filter.producteurId });
    if (filter.from) qb.andWhere("p.createdAt >= :from", { from: new Date(filter.from) });
    if (filter.to) qb.andWhere("p.createdAt <= :to", { to: new Date(filter.to) });
    qb.orderBy("p.createdAt", "DESC");

    return qb.getMany();
  }

  async getStats(): Promise<PaymentStats> {
    const total = await this.repo
      .createQueryBuilder("p")
      .select("COALESCE(SUM(p.amount), 0)", "volume")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END)", "success")
      .getRawOne();

    const byMethod = await this.repo
      .createQueryBuilder("p")
      .select("p.method", "method")
      .addSelect("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(p.amount), 0)", "volume")
      .groupBy("p.method")
      .getRawMany();

    const today = await this.repo
      .createQueryBuilder("p")
      .where("p.createdAt >= :today", { today: new Date().toISOString().split("T")[0] })
      .select("COUNT(*)", "count")
      .addSelect("COALESCE(SUM(p.amount), 0)", "volume")
      .getRawOne();

    const totalCount = parseInt(total?.count || "0");
    const successCount = parseInt(total?.success || "0");

    return {
      totalVolume: parseFloat(total?.volume || "0"),
      totalTransactions: totalCount,
      successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 10000) / 100 : 0,
      byMethod: (byMethod || []).map(r => ({
        method: r.method,
        count: parseInt(r.count),
        volume: parseFloat(r.volume),
      })),
      today: {
        count: parseInt(today?.count || "0"),
        volume: parseFloat(today?.volume || "0"),
      },
      pendingVerification: await this.repo.count({
        where: { method: "bank_transfer", status: "pending", verifiedByAdmin: false },
      }),
    };
  }

  toReadModel(payment: Payment): PaymentReadModel {
    return {
      id: payment.id,
      amount: parseFloat(payment.amount as any),
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      status: payment.status as PaymentStatus,
      buyerId: payment.buyerId,
      orderId: payment.orderId,
    };
  }
}
