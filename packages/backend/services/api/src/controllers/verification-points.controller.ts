import { Controller, Get, OnModuleInit, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { VerificationPoint } from "../entities/verification-point.entity";

const SEED: Partial<VerificationPoint>[] = [
  { id: "VP-ZOU-001", name: "Hub Zou — Coopérative Agrisud", region: "Zou", ville: "Abomey", cooperative: "Coopérative Agrisud Bénin", coordinates: [7.185, 1.998], capacityTonnes: 200, services: ["inspection", "stockage temporaire", "certification"], contact: "+229 01 23 45 67 01", inspectionFeeFcfa: 5000 },
  { id: "VP-BOR-001", name: "Hub Borgou — Coopérative Terroir", region: "Borgou", ville: "Parakou", cooperative: "Coopérative Terroir du Borgou", coordinates: [9.345, 2.625], capacityTonnes: 350, services: ["inspection", "stockage temporaire"], contact: "+229 01 23 45 67 02", inspectionFeeFcfa: 5000 },
  { id: "VP-MON-001", name: "Hub Mono — Coopérative Lacustre", region: "Mono", ville: "Lokossa", cooperative: "Coopérative Lacustre du Mono", coordinates: [6.638, 1.715], capacityTonnes: 150, services: ["inspection", "stockage temporaire", "conditionnement"], contact: "+229 01 23 45 67 03", inspectionFeeFcfa: 3500 },
  { id: "VP-OUA-001", name: "Hub Ouémé — Coopérative Vallée", region: "Ouémé", ville: "Porto-Novo", cooperative: "Coopérative Vallée de l'Ouémé", coordinates: [6.497, 2.605], capacityTonnes: 300, services: ["inspection", "stockage temporaire", "certification", "transit portuaire"], contact: "+229 01 23 45 67 04", inspectionFeeFcfa: 4500 },
  { id: "VP-ATL-001", name: "Hub Atlantique — Coopérative Côtière", region: "Atlantique", ville: "Cotonou", cooperative: "Coopérative Côtière de l'Atlantique", coordinates: [6.365, 2.418], capacityTonnes: 500, services: ["inspection", "stockage temporaire", "certification", "transit portuaire", "export"], contact: "+229 01 23 45 67 05", inspectionFeeFcfa: 6000 },
];

@Controller("api")
export class VerificationPointsController implements OnModuleInit {
  private readonly logger = new Logger(VerificationPointsController.name);

  constructor(
    @InjectRepository(VerificationPoint)
    private readonly repo: Repository<VerificationPoint>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      const hasTable = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'verification_points'
        )
      `);
      if (!hasTable[0].exists) {
        await this.dataSource.query(`
          CREATE TABLE verification_points (
            id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            region VARCHAR(100) NOT NULL,
            ville VARCHAR(100) NOT NULL,
            cooperative VARCHAR(200) NOT NULL,
            coordinates DOUBLE PRECISION[] NOT NULL,
            capacity_tonnes INTEGER NOT NULL,
            services TEXT[] NOT NULL,
            contact VARCHAR(30) NOT NULL,
            inspection_fee_fcfa INTEGER NOT NULL
          )
        `);
        this.logger.log("Created verification_points table");
      }

      const count = await this.repo.count();
      if (count === 0) {
        await this.repo.save(SEED);
        this.logger.log(`Seeded ${SEED.length} verification points`);
      }
    } catch (err) {
      this.logger.warn("Could not init verification_points table — seeding will be skipped", err);
    }
  }

  @Get("verification-points")
  async findAll() {
    const points = await this.repo.find({ order: { id: "ASC" } });
    return points.map((p) => ({
      ...p,
      coordinates: p.coordinates as [number, number],
    }));
  }
}
