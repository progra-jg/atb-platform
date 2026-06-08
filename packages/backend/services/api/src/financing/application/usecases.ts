import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, MoreThan } from "typeorm";
import { FinancingOfferEntity } from "../../entities/financing-offer.entity";
import { FinancingContractEntity } from "../../entities/financing-contract.entity";
import { FinancingRepaymentEntity } from "../../entities/financing-repayment.entity";
import { FinancingEventBus } from "../infrastructure/event-bus";
import { defaultOffers, generateSchedule, computeTotalRepayable, computePenalty } from "../domain/methods";
import type { FinancingEligibility, FinancingOffer, FinancingContract, RepaymentSchedule, ContractStatus, RepaymentStatus } from "../domain/types";

function toOffer(e: FinancingOfferEntity): FinancingOffer {
  return { id: e.id, inputType: e.inputType, label: e.label, maxAmount: e.maxAmount, interestRate: e.interestRate, durationDays: e.durationDays, minTrustScore: e.minTrustScore, collateralRequired: JSON.parse(e.collateralRequired || "[]"), active: e.active };
}

function toContract(e: FinancingContractEntity): FinancingContract {
  return { id: e.id, producteurId: e.producteurId, offerId: e.offerId, amount: e.amount, interestRate: e.interestRate, totalRepayable: e.totalRepayable, status: e.status as ContractStatus, collateralType: e.collateralType as any, collateralRef: e.collateralRef, disbursedAt: e.disbursedAt, repaidAt: e.repaidAt, dueDate: e.dueDate, schedule: JSON.parse(e.schedule || "[]"), createdAt: e.createdAt, updatedAt: e.updatedAt };
}

@Injectable()
export class CheckEligibility {
  constructor(@InjectRepository(FinancingContractEntity) private repo: Repository<FinancingContractEntity>) {}

  async execute(producteurId: string, trustScore: number): Promise<FinancingEligibility> {
    const [activeContracts, totalOutstandingRaw] = await Promise.all([
      this.repo.find({ where: { producteurId, status: "active" } }),
      this.repo.find({ where: { producteurId, status: "active" } }),
    ]);
    const totalOutstanding = totalOutstandingRaw.reduce((s, c) => s + c.totalRepayable, 0);
    const completedContracts = await this.repo.find({ where: { producteurId, status: "repaid" } });
    const totalCompleted = completedContracts.length;
    const onTimeCount = completedContracts.filter((c) => {
      const schedule: RepaymentSchedule[] = JSON.parse(c.schedule || "[]");
      return schedule.every((r) => r.status === "paid");
    }).length;
    const repaymentRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : 100;
    const minRequired = 550;
    const maxAmount = trustScore >= 750 ? 2000000 : trustScore >= 650 ? 1000000 : trustScore >= 550 ? 500000 : 0;
    const offers = defaultOffers().filter((o) => trustScore >= o.minTrustScore && maxAmount >= o.maxAmount * 0.3);

    return {
      eligible: trustScore >= minRequired && offers.length > 0,
      score: trustScore,
      minRequired,
      maxAmount,
      availableOffers: offers,
      reason: trustScore < minRequired ? "Votre score de confiance est insuffisant. Continuez à effectuer des transactions pour l'augmenter." : undefined,
      activeContracts: activeContracts.length,
      totalOutstanding,
      repaymentRate,
    };
  }
}

@Injectable()
export class ApplyForFinancing {
  constructor(
    @InjectRepository(FinancingOfferEntity) private offerRepo: Repository<FinancingOfferEntity>,
    @InjectRepository(FinancingContractEntity) private contractRepo: Repository<FinancingContractEntity>,
    private eligibility: CheckEligibility,
    private bus: FinancingEventBus,
  ) {}

  async execute(producteurId: string, offerId: string, amount: number, trustScore: number, collateralType: string, collateralRef?: string): Promise<FinancingContract> {
    const allOffers = defaultOffers();
    const offer = allOffers.find((o) => o.id === offerId);
    if (!offer) throw new NotFoundException("Offre de financement introuvable");
    if (amount > offer.maxAmount) throw new BadRequestException("Montant supérieur au maximum autorisé");
    const elig = await this.eligibility.execute(producteurId, trustScore);
    if (!elig.eligible) throw new BadRequestException(elig.reason || "Non éligible au financement");
    if (amount > elig.maxAmount) throw new BadRequestException("Montant supérieur à votre limite");
    const contract = this.contractRepo.create({
      producteurId,
      offerId,
      amount,
      interestRate: offer.interestRate,
      totalRepayable: computeTotalRepayable(amount, offer.interestRate),
      status: "active",
      collateralType,
      collateralRef,
      disbursedAt: new Date(),
      dueDate: new Date(Date.now() + offer.durationDays * 86400000),
      schedule: JSON.stringify(generateSchedule(amount, offer.interestRate, offer.durationDays)),
    });
    const saved = await this.contractRepo.save(contract);
    this.bus.emit("financing.disbursed", { contractId: saved.id, producteurId, amount });
    return toContract(saved);
  }
}

@Injectable()
export class ProcessRepayment {
  constructor(
    @InjectRepository(FinancingContractEntity) private repo: Repository<FinancingContractEntity>,
    @InjectRepository(FinancingRepaymentEntity) private repaymentRepo: Repository<FinancingRepaymentEntity>,
    private bus: FinancingEventBus,
  ) {}

  async execute(contractId: string, amount: number, transactionRef: string): Promise<FinancingContract> {
    const entity = await this.repo.findOne({ where: { id: contractId } });
    if (!entity) throw new NotFoundException("Contrat introuvable");
    if (entity.status !== "active") throw new BadRequestException("Contrat déjà remboursé ou clos");
    const schedule: RepaymentSchedule[] = JSON.parse(entity.schedule || "[]");
    const dueIdx = schedule.findIndex((r) => r.status === "pending" || r.status === "overdue");
    if (dueIdx === -1) throw new BadRequestException("Aucune échéance due");
    const due = schedule[dueIdx];
    const overdueDays = Math.max(0, Math.floor((Date.now() - new Date(due.dueDate).getTime()) / 86400000));
    const penalty = overdueDays > 0 ? computePenalty(overdueDays, due.amount) : 0;
    const totalDue = due.amount + penalty;
    if (amount < totalDue) throw new BadRequestException(`Montant insuffisant. Attendu: ${totalDue}, reçu: ${amount}`);
    due.status = "paid";
    due.paidAt = new Date();
    due.paidAmount = totalDue;
    due.transactionRef = transactionRef;
    const allPaid = schedule.every((r) => r.status === "paid");
    if (allPaid) {
      entity.status = "repaid";
      entity.repaidAt = new Date();
    }
    entity.schedule = JSON.stringify(schedule);
    const updated = await this.repo.save(entity);
    await this.repaymentRepo.save(this.repaymentRepo.create({
      contractId,
      installmentIndex: dueIdx,
      amount: due.amount,
      penalty,
      totalPaid: totalDue,
      transactionRef,
    }));
    const evt = allPaid ? "financing.repaid" : "financing.repayment";
    this.bus.emit(evt, { contractId, amount: totalDue, transactionRef });
    return toContract(updated);
  }
}

@Injectable()
export class GetActiveContracts {
  constructor(@InjectRepository(FinancingContractEntity) private repo: Repository<FinancingContractEntity>) {}
  async execute(producteurId: string): Promise<FinancingContract[]> {
    const entities = await this.repo.find({ where: { producteurId, status: "active" }, order: { createdAt: "DESC" } });
    return entities.map(toContract);
  }
}

@Injectable()
export class GetContractById {
  constructor(@InjectRepository(FinancingContractEntity) private repo: Repository<FinancingContractEntity>) {}
  async execute(id: string): Promise<FinancingContract> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException("Contrat introuvable");
    return toContract(entity);
  }
}

@Injectable()
export class CheckOverdueContracts {
  constructor(@InjectRepository(FinancingContractEntity) private repo: Repository<FinancingContractEntity>, private bus: FinancingEventBus) {}
  async execute(): Promise<number> {
    const overdue = await this.repo.find({ where: { status: "active", dueDate: LessThan(new Date()) } });
    for (const c of overdue) {
      const schedule: RepaymentSchedule[] = JSON.parse(c.schedule || "[]");
      let changed = false;
      for (const r of schedule) {
        if (r.status === "pending" && new Date(r.dueDate) < new Date()) {
          r.status = "overdue";
          changed = true;
        }
      }
      if (changed) {
        c.schedule = JSON.stringify(schedule);
        await this.repo.save(c);
        this.bus.emit("financing.overdue", { contractId: c.id, producteurId: c.producteurId });
      }
    }
    return overdue.length;
  }
}
