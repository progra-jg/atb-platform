import { Injectable, OnApplicationBootstrap, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { BuyerProfile } from "../profiles/buyer-profile.entity";

interface DefaultAccount {
  email: string;
  password: string;
  company: string;
  role: string;
}

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  private readonly defaults: DefaultAccount[] = [
    { email: "popomomololo525@gmail.com", password: "123456", company: "ATB AgriTrace", role: "user" },
    { email: "admin@atb.bj", password: "admin123", company: "ATB Administration", role: "admin" },
  ];

  constructor(
    @InjectRepository(BuyerProfile)
    private buyerRepo: Repository<BuyerProfile>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.NODE_ENV === "production") return;

    for (const acct of this.defaults) {
      const existing = await this.buyerRepo.findOne({ where: { email: acct.email } });
      if (existing) {
        this.logger.log(`Account already exists: ${acct.email}`);
        continue;
      }
      const passwordHash = await bcrypt.hash(acct.password, 12);
      await this.buyerRepo.save({
        company: acct.company,
        email: acct.email,
        country: "Bénin",
        passwordHash,
        role: acct.role,
      });
      this.logger.log(`Account created: ${acct.email} / ${acct.password} (${acct.role})`);
    }
  }
}
