import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { FinancingOfferEntity } from "../../../entities/financing-offer.entity";
import { FinancingContractEntity } from "../../../entities/financing-contract.entity";
import { FinancingRepaymentEntity } from "../../../entities/financing-repayment.entity";
import {
  CheckEligibility,
  ApplyForFinancing,
  ProcessRepayment,
  GetActiveContracts,
  GetContractById,
  CheckOverdueContracts,
} from "../usecases";
import { FinancingEventBus } from "../../infrastructure/event-bus";

const mockOfferRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockContractRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockBus = () => ({
  emit: jest.fn(),
  on: jest.fn(),
});

const mockRepaymentRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe("CheckEligibility", () => {
  let usecase: CheckEligibility;
  let contractRepo: jest.Mocked<Repository<FinancingContractEntity>>;

  beforeEach(async () => {
    contractRepo = mockContractRepo() as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckEligibility,
        { provide: getRepositoryToken(FinancingContractEntity), useValue: contractRepo },
      ],
    }).compile();
    usecase = module.get(CheckEligibility);
  });

  it("returns eligible=true for trustScore >= 550 with offers", async () => {
    contractRepo.find.mockResolvedValue([]);
    const result = await usecase.execute("prod_1", 600);
    expect(result.eligible).toBe(true);
    expect(result.score).toBe(600);
    expect(result.minRequired).toBe(550);
    expect(result.maxAmount).toBeGreaterThan(0);
  });

  it("returns eligible=false for trustScore < 550", async () => {
    contractRepo.find.mockResolvedValue([]);
    const result = await usecase.execute("prod_1", 500);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("returns maxAmount=500000 for trustScore 550-649", async () => {
    contractRepo.find.mockResolvedValue([]);
    const result = await usecase.execute("prod_1", 600);
    expect(result.maxAmount).toBe(500000);
  });

  it("returns maxAmount=1000000 for trustScore 650-749", async () => {
    contractRepo.find.mockResolvedValue([]);
    const result = await usecase.execute("prod_1", 700);
    expect(result.maxAmount).toBe(1000000);
  });

  it("returns maxAmount=2000000 for trustScore >= 750", async () => {
    contractRepo.find.mockResolvedValue([]);
    const result = await usecase.execute("prod_1", 800);
    expect(result.maxAmount).toBe(2000000);
  });

  it("calculates repaymentRate from completed contracts", async () => {
    contractRepo.find.mockImplementation(async (opts?: any) => {
      if (opts?.where?.status === "active") return [];
      if (opts?.where?.status === "repaid") return [
        { schedule: JSON.stringify([{ status: "paid" }, { status: "paid" }]) },
        { schedule: JSON.stringify([{ status: "paid" }, { status: "overdue" }]) },
      ] as any;
      return [];
    });
    const result = await usecase.execute("prod_1", 650);
    expect(result.repaymentRate).toBe(50);
  });
});

describe("ApplyForFinancing", () => {
  let usecase: ApplyForFinancing;
  let offerRepo: jest.Mocked<Repository<FinancingOfferEntity>>;
  let contractRepo: jest.Mocked<Repository<FinancingContractEntity>>;
  let bus: jest.Mocked<FinancingEventBus>;

  beforeEach(async () => {
    offerRepo = mockOfferRepo() as any;
    contractRepo = mockContractRepo() as any;
    bus = mockBus() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyForFinancing,
        CheckEligibility,
        { provide: getRepositoryToken(FinancingOfferEntity), useValue: offerRepo },
        { provide: getRepositoryToken(FinancingContractEntity), useValue: contractRepo },
        { provide: FinancingEventBus, useValue: bus },
      ],
    }).compile();
    usecase = module.get(ApplyForFinancing);
  });

  it("throws NotFoundException for unknown offer", async () => {
    contractRepo.find.mockResolvedValue([]);
    await expect(
      usecase.execute("prod_1", "offer_nonexistent", 100000, 600, "harvest")
    ).rejects.toThrow(NotFoundException);
  });

  it("throws BadRequestException for amount over offer max", async () => {
    contractRepo.find.mockResolvedValue([]);
    await expect(
      usecase.execute("prod_1", "offer_transport", 999999, 600, "harvest")
    ).rejects.toThrow(BadRequestException);
  });

  it("creates contract and emits event on success", async () => {
    contractRepo.find.mockResolvedValue([]);
    const created = {
      id: "c1",
      producteurId: "prod_1",
      offerId: "offer_transport",
      amount: 200000,
      interestRate: 10,
      totalRepayable: 220000,
      status: "active",
      collateralType: "harvest",
      schedule: JSON.stringify([]),
      disbursedAt: new Date(),
      dueDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    contractRepo.create.mockReturnValue(created as any);
    contractRepo.save.mockResolvedValue(created as any);

    const result = await usecase.execute("prod_1", "offer_transport", 200000, 600, "harvest");
    expect(result.status).toBe("active");
    expect(bus.emit).toHaveBeenCalledWith("financing.disbursed", expect.objectContaining({
      contractId: "c1",
      producteurId: "prod_1",
      amount: 200000,
    }));
  });
});

describe("ProcessRepayment", () => {
  let usecase: ProcessRepayment;
  let contractRepo: jest.Mocked<Repository<FinancingContractEntity>>;
  let repaymentRepo: jest.Mocked<Repository<FinancingRepaymentEntity>>;
  let bus: jest.Mocked<FinancingEventBus>;

  beforeEach(async () => {
    contractRepo = mockContractRepo() as any;
    repaymentRepo = mockRepaymentRepo() as any;
    bus = mockBus() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessRepayment,
        { provide: getRepositoryToken(FinancingContractEntity), useValue: contractRepo },
        { provide: getRepositoryToken(FinancingRepaymentEntity), useValue: repaymentRepo },
        { provide: FinancingEventBus, useValue: bus },
      ],
    }).compile();
    usecase = module.get(ProcessRepayment);
  });

  const createEntity = (overrides: any = {}) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() - 30);
    return {
      id: "c1",
      producteurId: "prod_1",
      offerId: "offer_transport",
      amount: 200000,
      interestRate: 10,
      totalRepayable: 220000,
      status: "active",
      collateralType: "harvest",
      schedule: JSON.stringify([
        { dueDate: dueDate.toISOString(), amount: 73334, status: "pending" },
        { dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), amount: 73333, status: "pending" },
        { dueDate: new Date(Date.now() + 60 * 86400000).toISOString(), amount: 73333, status: "pending" },
      ]),
      disbursedAt: new Date(),
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    } as unknown as FinancingContractEntity;
  };

  it("throws NotFoundException for unknown contract", async () => {
    contractRepo.findOne.mockResolvedValue(null);
    await expect(usecase.execute("missing", 10000, "txn_1")).rejects.toThrow(NotFoundException);
  });

  it("throws if contract is not active", async () => {
    contractRepo.findOne.mockResolvedValue(createEntity({ status: "repaid" }));
    await expect(usecase.execute("c1", 10000, "txn_1")).rejects.toThrow(BadRequestException);
  });

  it("throws if amount is insufficient", async () => {
    contractRepo.findOne.mockResolvedValue(createEntity());
    await expect(usecase.execute("c1", 100, "txn_1")).rejects.toThrow(BadRequestException);
  });

  it("marks installment as paid on successful repayment", async () => {
    const entity = createEntity();
    contractRepo.findOne.mockResolvedValue(entity);
    contractRepo.save.mockImplementation(async (e) => e);
    repaymentRepo.create.mockImplementation((e) => e as any);
    repaymentRepo.save.mockResolvedValue({} as any);

    const result = await usecase.execute("c1", 85000, "txn_1");
    const schedule = result.schedule;
    expect(schedule[0].status).toBe("paid");
    expect(schedule[0].transactionRef).toBe("txn_1");
    expect(result.status).toBe("active");
    expect(bus.emit).toHaveBeenCalledWith("financing.repayment", expect.any(Object));
    expect(repaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ contractId: "c1", installmentIndex: 0, transactionRef: "txn_1" }));
    expect(repaymentRepo.save).toHaveBeenCalled();
  });

  it("marks contract repaid when all installments paid", async () => {
    const entity = createEntity();
    entity.schedule = JSON.stringify([
      { dueDate: new Date().toISOString(), amount: 73334, status: "paid", paidAt: new Date(), paidAmount: 73334 },
      { dueDate: new Date().toISOString(), amount: 73333, status: "paid", paidAt: new Date(), paidAmount: 73333 },
      { dueDate: new Date().toISOString(), amount: 73333, status: "pending" },
    ]);
    contractRepo.findOne.mockResolvedValue(entity);
    contractRepo.save.mockImplementation(async (e) => e);
    repaymentRepo.create.mockImplementation((e) => e as any);
    repaymentRepo.save.mockResolvedValue({} as any);

    const result = await usecase.execute("c1", 73333, "txn_final");
    expect(result.status).toBe("repaid");
    expect(result.repaidAt).toBeDefined();
    expect(bus.emit).toHaveBeenCalledWith("financing.repaid", expect.any(Object));
    expect(repaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ contractId: "c1", installmentIndex: 2, transactionRef: "txn_final" }));
    expect(repaymentRepo.save).toHaveBeenCalled();
  });

  it("applies penalty for overdue installments", async () => {
    const entity = createEntity();
    contractRepo.findOne.mockResolvedValue(entity);
    contractRepo.save.mockImplementation(async (e) => e);
    repaymentRepo.create.mockImplementation((e) => e as any);
    repaymentRepo.save.mockResolvedValue({} as any);

    const result = await usecase.execute("c1", 85000, "txn_1");
    const schedule = result.schedule;
    expect(schedule[0].paidAmount).toBeGreaterThan(schedule[0].amount);
    expect(repaymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ penalty: expect.any(Number) }));
  });
});

describe("GetActiveContracts", () => {
  let usecase: GetActiveContracts;
  let contractRepo: jest.Mocked<Repository<FinancingContractEntity>>;

  beforeEach(async () => {
    contractRepo = mockContractRepo() as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetActiveContracts,
        { provide: getRepositoryToken(FinancingContractEntity), useValue: contractRepo },
      ],
    }).compile();
    usecase = module.get(GetActiveContracts);
  });

  it("returns active contracts for producteur", async () => {
    const entities = [{ id: "c1", status: "active", schedule: "[]", createdAt: new Date(), updatedAt: new Date(), disbursedAt: new Date(), dueDate: new Date() }] as any;
    contractRepo.find.mockResolvedValue(entities);
    const result = await usecase.execute("prod_1");
    expect(result).toHaveLength(1);
    expect(contractRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { producteurId: "prod_1", status: "active" },
    }));
  });
});

describe("GetContractById", () => {
  let usecase: GetContractById;
  let contractRepo: jest.Mocked<Repository<FinancingContractEntity>>;

  beforeEach(async () => {
    contractRepo = mockContractRepo() as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetContractById,
        { provide: getRepositoryToken(FinancingContractEntity), useValue: contractRepo },
      ],
    }).compile();
    usecase = module.get(GetContractById);
  });

  it("returns contract by id", async () => {
    contractRepo.findOne.mockResolvedValue({ id: "c1", schedule: "[]", createdAt: new Date(), updatedAt: new Date(), disbursedAt: new Date(), dueDate: new Date() } as any);
    const result = await usecase.execute("c1");
    expect(result.id).toBe("c1");
  });

  it("throws NotFoundException for missing contract", async () => {
    contractRepo.findOne.mockResolvedValue(null);
    await expect(usecase.execute("missing")).rejects.toThrow(NotFoundException);
  });
});

describe("CheckOverdueContracts", () => {
  let usecase: CheckOverdueContracts;
  let contractRepo: jest.Mocked<Repository<FinancingContractEntity>>;
  let bus: jest.Mocked<FinancingEventBus>;

  beforeEach(async () => {
    contractRepo = mockContractRepo() as any;
    bus = mockBus() as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckOverdueContracts,
        { provide: getRepositoryToken(FinancingContractEntity), useValue: contractRepo },
        { provide: FinancingEventBus, useValue: bus },
      ],
    }).compile();
    usecase = module.get(CheckOverdueContracts);
  });

  it("marks overdue installments and returns count", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const entity = {
      id: "c1",
      producteurId: "prod_1",
      status: "active",
      schedule: JSON.stringify([
        { dueDate: pastDate.toISOString(), amount: 50000, status: "pending" },
        { dueDate: new Date(Date.now() + 30 * 86400000).toISOString(), amount: 50000, status: "pending" },
      ]),
      disbursedAt: new Date(),
      dueDate: pastDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as FinancingContractEntity;

    contractRepo.find.mockResolvedValue([entity]);
    contractRepo.save.mockImplementation(async (e) => e);

    const count = await usecase.execute();
    expect(count).toBe(1);
    const schedule = JSON.parse(entity.schedule);
    expect(schedule[0].status).toBe("overdue");
    expect(schedule[1].status).toBe("pending");
    expect(bus.emit).toHaveBeenCalledWith("financing.overdue", expect.objectContaining({
      contractId: "c1",
    }));
  });

  it("returns 0 when no overdue contracts", async () => {
    contractRepo.find.mockResolvedValue([]);
    const count = await usecase.execute();
    expect(count).toBe(0);
  });
});
