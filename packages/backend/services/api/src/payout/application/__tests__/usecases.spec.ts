import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Payment } from "../../../entities/payment.entity";
import { Payout } from "../../../entities/payout.entity";

import {
  InitiatePayoutUseCase,
  GetPayoutStatusUseCase,
  GetPayoutStatsUseCase,
  ListPayoutsUseCase,
} from "../usecases";
import { PayoutRepository } from "../../infrastructure/repository";
import { PayoutProviderRegistry } from "../../infrastructure/providers";
import { PayoutEventBus } from "../../infrastructure/event-bus";
import { PayoutStatus, PayoutProviderId, PayoutMethod } from "../../domain/types";

describe("InitiatePayoutUseCase", () => {
  let usecase: InitiatePayoutUseCase;
  let repo: jest.Mocked<PayoutRepository>;
  let providers: jest.Mocked<PayoutProviderRegistry>;
  let eventBus: jest.Mocked<PayoutEventBus>;
  let paymentRepo: jest.Mocked<Repository<Payment>>;

  const mockPayout = {
    id: "a1b2c3d4",
    paymentId: "pay_1",
    orderId: "ord_1",
    producteurId: "prod_1",
    amount: 150000,
    currency: "XOF",
    method: "mobile_money",
    provider: "mtn_momo",
    phone: "+22961010101",
    status: PayoutStatus.PENDING,
    idempotencyKey: null,
    providerRef: null,
    completedAt: null,
    failedAt: null,
    failureReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    statusMessage: null,
    providerData: null,
    retryCount: 0,
    lastRetryAt: null,
  } as unknown as Payout;

  const mockProvider = {
    id: PayoutProviderId.MTN_MOMO,
    disburse: jest.fn(),
    checkStatus: jest.fn(),
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      toReadModel: jest.fn(),
      findWithFilter: jest.fn(),
      getStats: jest.fn(),
    } as any;

    providers = {
      get: jest.fn().mockReturnValue(mockProvider),
      register: jest.fn(),
      getAll: jest.fn(),
    } as any;

    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as any;

    paymentRepo = {
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InitiatePayoutUseCase,
        { provide: PayoutRepository, useValue: repo },
        { provide: PayoutProviderRegistry, useValue: providers },
        { provide: PayoutEventBus, useValue: eventBus },
        { provide: getRepositoryToken(Payment), useValue: paymentRepo },
      ],
    }).compile();

    usecase = module.get(InitiatePayoutUseCase);
  });

  it("is defined", () => {
    expect(usecase).toBeDefined();
  });

  it("throws if phone is missing", async () => {
    await expect(
      usecase.execute({
        paymentId: "pay_1",
        orderId: "ord_1",
        producteurId: "prod_1",
        amount: 150000,
        method: "mobile_money",
        provider: "mtn_momo",
        phone: "",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws if amount exceeds provider max", async () => {
    await expect(
      usecase.execute({
        paymentId: "pay_1",
        orderId: "ord_1",
        producteurId: "prod_1",
        amount: 9999999,
        method: "mobile_money",
        provider: "mtn_momo",
        phone: "+22961010101",
      }),
    ).rejects.toThrow(Error);
  });

  it("throws if payment not found", async () => {
    paymentRepo.findOne.mockResolvedValue(null);
    await expect(
      usecase.execute({
        paymentId: "pay_unknown",
        orderId: "ord_1",
        producteurId: "prod_1",
        amount: 150000,
        method: "mobile_money",
        provider: "mtn_momo",
        phone: "+22961010101",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("throws if payment is not completed", async () => {
    paymentRepo.findOne.mockResolvedValue({ id: "pay_1", status: "pending" } as any);
    await expect(
      usecase.execute({
        paymentId: "pay_1",
        orderId: "ord_1",
        producteurId: "prod_1",
        amount: 150000,
        method: "mobile_money",
        provider: "mtn_momo",
        phone: "+22961010101",
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it("completes payout when provider returns success", async () => {
    paymentRepo.findOne.mockResolvedValue({ id: "pay_1", status: "completed" } as any);
    repo.create.mockResolvedValue(mockPayout);
    repo.save.mockResolvedValue({ ...mockPayout, status: PayoutStatus.COMPLETED, providerRef: "REF001", completedAt: new Date() } as Payout);
    mockProvider.disburse.mockResolvedValue({ status: PayoutStatus.COMPLETED, providerRef: "REF001" });
    repo.toReadModel.mockReturnValue({ id: "a1b2c3d4", status: PayoutStatus.PENDING } as any);

    const result = await usecase.execute({
      paymentId: "pay_1",
      orderId: "ord_1",
      producteurId: "prod_1",
      amount: 150000,
      method: "mobile_money",
      provider: "mtn_momo",
      phone: "+22961010101",
    });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
  });

  it("marks payout failed when provider returns failure", async () => {
    paymentRepo.findOne.mockResolvedValue({ id: "pay_1", status: "completed" } as any);
    repo.create.mockResolvedValue(mockPayout);
    repo.save.mockResolvedValue({ ...mockPayout, status: PayoutStatus.FAILED, failureReason: "Provider returned failure" } as Payout);
    mockProvider.disburse.mockResolvedValue({ status: PayoutStatus.FAILED });
    repo.toReadModel.mockReturnValue({ id: "a1b2c3d4", status: PayoutStatus.PENDING } as any);

    const result = await usecase.execute({
      paymentId: "pay_1",
      orderId: "ord_1",
      producteurId: "prod_1",
      amount: 150000,
      method: "mobile_money",
      provider: "mtn_momo",
      phone: "+22961010101",
    });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("failed");
    expect(result.data.failureReason).toBe("Provider returned failure");
  });
});

describe("GetPayoutStatusUseCase", () => {
  let usecase: GetPayoutStatusUseCase;
  let repo: jest.Mocked<PayoutRepository>;
  let providers: jest.Mocked<PayoutProviderRegistry>;
  let eventBus: jest.Mocked<PayoutEventBus>;

  let basePayout: any;
  let checkStatusMock: jest.Mock;

  beforeEach(async () => {
    basePayout = {
      id: "p1",
      paymentId: "pay_1",
      orderId: "ord_1",
      producteurId: "prod_1",
      amount: 150000,
      currency: "XOF",
      method: "mobile_money",
      provider: "mtn_momo",
      phone: "+22961010101",
      providerRef: "REF_001",
      status: PayoutStatus.PROCESSING,
      completedAt: null,
      failedAt: null,
      failureReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      statusMessage: null,
      providerData: null,
      retryCount: 0,
      lastRetryAt: null,
    };

    repo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    checkStatusMock = jest.fn();
    const mockProvider: any = {
      id: PayoutProviderId.MTN_MOMO,
      checkStatus: checkStatusMock,
      disburse: jest.fn(),
    };

    providers = {
      get: jest.fn().mockReturnValue(mockProvider),
    } as any;

    eventBus = { publish: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPayoutStatusUseCase,
        { provide: PayoutRepository, useValue: repo },
        { provide: PayoutProviderRegistry, useValue: providers },
        { provide: PayoutEventBus, useValue: eventBus },
      ],
    }).compile();

    usecase = module.get(GetPayoutStatusUseCase);
  });

  it("returns payout without provider check when completed", async () => {
    repo.findById.mockResolvedValue({ ...basePayout, status: PayoutStatus.COMPLETED, completedAt: new Date() } as Payout);
    const result = await usecase.execute("p1");
    expect(result.data.status).toBe("completed");
  });

  it("returns payout without provider check when failed", async () => {
    repo.findById.mockResolvedValue({ ...basePayout, status: PayoutStatus.FAILED } as Payout);
    const result = await usecase.execute("p1");
    expect(result.data.status).toBe("failed");
  });

  it("checks provider status for processing payout", async () => {
    repo.findById.mockResolvedValue(basePayout);
    checkStatusMock.mockResolvedValue({ status: PayoutStatus.COMPLETED });
    repo.save.mockImplementation(async (p) => p);

    const result = await usecase.execute("p1");
    expect(result.data.status).toBe("completed");
  });

  it("marks failed when provider returns failed status", async () => {
    repo.findById.mockResolvedValue(basePayout);
    checkStatusMock.mockReset();
    checkStatusMock.mockResolvedValue({ status: PayoutStatus.FAILED });
    repo.save.mockImplementation(async (p) => p);

    const result = await usecase.execute("p1");
    expect(result.data.status).toBe("failed");
    expect(result.data.failureReason).toBe("Provider status check failed");
  });
});

describe("GetPayoutStatsUseCase", () => {
  let usecase: GetPayoutStatsUseCase;
  let repo: jest.Mocked<PayoutRepository>;

  beforeEach(async () => {
    repo = { getStats: jest.fn() } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPayoutStatsUseCase,
        { provide: PayoutRepository, useValue: repo },
      ],
    }).compile();
    usecase = module.get(GetPayoutStatsUseCase);
  });

  it("returns stats for all producteurs when no filter", async () => {
    repo.getStats.mockResolvedValue({
      totalDisbursed: 1000000,
      totalTransactions: 10,
      successRate: 90,
      byProvider: [],
      today: { count: 2, volume: 300000 },
      pendingCount: 1,
    });
    const result = await usecase.execute();
    expect(result.success).toBe(true);
    expect(result.data.totalDisbursed).toBe(1000000);
  });

  it("filters by producteurId", async () => {
    repo.getStats.mockResolvedValue({
      totalDisbursed: 500000,
      totalTransactions: 5,
      successRate: 80,
      byProvider: [],
      today: { count: 1, volume: 100000 },
      pendingCount: 0,
    });
    const result = await usecase.execute("prod_1");
    expect(repo.getStats).toHaveBeenCalledWith("prod_1");
    expect(result.data.totalDisbursed).toBe(500000);
  });
});

describe("ListPayoutsUseCase", () => {
  let usecase: ListPayoutsUseCase;
  let repo: jest.Mocked<PayoutRepository>;

  beforeEach(async () => {
    repo = { findWithFilter: jest.fn() } as any;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListPayoutsUseCase,
        { provide: PayoutRepository, useValue: repo },
      ],
    }).compile();
    usecase = module.get(ListPayoutsUseCase);
  });

  it("returns all payouts when no filter", async () => {
    repo.findWithFilter.mockResolvedValue([]);
    const result = await usecase.execute({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("filters by producteurId and status", async () => {
    repo.findWithFilter.mockResolvedValue([]);
    await usecase.execute({ producteurId: "prod_1", status: "completed" });
    expect(repo.findWithFilter).toHaveBeenCalledWith({ producteurId: "prod_1", status: "completed" });
  });
});
