import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Payout } from "../../../entities/payout.entity";
import { PayoutRepository } from "../repository";
import { PayoutStatus } from "../../domain/types";

describe("PayoutRepository", () => {
  let repo: PayoutRepository;
  let typeormRepo: jest.Mocked<Repository<Payout>>;

  const mockPayoutEntity = {
    id: "p1",
    paymentId: "pay_1",
    orderId: "ord_1",
    producteurId: "prod_1",
    amount: 150000,
    currency: "XOF",
    method: "mobile_money",
    provider: "mtn_momo",
    phone: "+22961010101",
    status: PayoutStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Payout;

  beforeEach(async () => {
    typeormRepo = {
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutRepository,
        { provide: getRepositoryToken(Payout), useValue: typeormRepo },
      ],
    }).compile();

    repo = module.get(PayoutRepository);
  });

  describe("save", () => {
    it("delegates to typeorm save", async () => {
      typeormRepo.save.mockResolvedValue(mockPayoutEntity);
      const result = await repo.save(mockPayoutEntity);
      expect(result).toBe(mockPayoutEntity);
    });
  });

  describe("create", () => {
    it("delegates to typeorm create", async () => {
      typeormRepo.create.mockReturnValue(mockPayoutEntity);
      const result = await repo.create({ id: "p1" });
      expect(result).toBe(mockPayoutEntity);
    });
  });

  describe("findById", () => {
    it("returns payout when found", async () => {
      typeormRepo.findOne.mockResolvedValue(mockPayoutEntity);
      const result = await repo.findById("p1");
      expect(result.id).toBe("p1");
    });

    it("throws NotFoundException when not found", async () => {
      typeormRepo.findOne.mockResolvedValue(null);
      await expect(repo.findById("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByIdOrNull", () => {
    it("returns null when not found", async () => {
      typeormRepo.findOne.mockResolvedValue(null);
      const result = await repo.findByIdOrNull("missing");
      expect(result).toBeNull();
    });
  });

  describe("toReadModel", () => {
    it("maps Payout entity to PayoutReadModel", () => {
      const result = repo.toReadModel(mockPayoutEntity);
      expect(result.id).toBe("p1");
      expect(result.amount).toBe(150000);
      expect(result.status).toBe(PayoutStatus.PENDING);
    });
  });
});
