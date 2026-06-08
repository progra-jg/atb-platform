import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancingOfferEntity } from "../../entities/financing-offer.entity";
import { defaultOffers } from "../domain/methods";

@Injectable()
export class FinancingSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(FinancingOfferEntity)
    private offerRepo: Repository<FinancingOfferEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.offerRepo.count();
    if (count > 0) return;
    const offers = defaultOffers().map((o) => this.offerRepo.create({
      id: o.id,
      inputType: o.inputType,
      label: o.label,
      maxAmount: o.maxAmount,
      interestRate: o.interestRate,
      durationDays: o.durationDays,
      minTrustScore: o.minTrustScore,
      collateralRequired: JSON.stringify(o.collateralRequired),
      active: true,
    }));
    await this.offerRepo.save(offers);
    console.log(`[Financing] Seeded ${offers.length} financing offers`);
  }
}
