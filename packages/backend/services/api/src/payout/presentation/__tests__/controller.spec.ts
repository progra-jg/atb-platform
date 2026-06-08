import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { PayoutController } from "../controller";
import { JwtAuthGuard } from "../../../guards/jwt-auth.guard";
import {
  InitiatePayoutUseCase,
  GetPayoutStatusUseCase,
  GetPayoutStatsUseCase,
  ListPayoutsUseCase,
} from "../../application/usecases";
import { PayoutRepository } from "../../infrastructure/repository";

describe("PayoutController", () => {
  let controller: PayoutController;
  let initiatePayout: jest.Mocked<InitiatePayoutUseCase>;
  let getStatus: jest.Mocked<GetPayoutStatusUseCase>;
  let getStats: jest.Mocked<GetPayoutStatsUseCase>;
  let listUseCase: jest.Mocked<ListPayoutsUseCase>;
  let repo: jest.Mocked<PayoutRepository>;

  beforeEach(async () => {
    initiatePayout = { execute: jest.fn() } as any;
    getStatus = { execute: jest.fn() } as any;
    getStats = { execute: jest.fn() } as any;
    listUseCase = { execute: jest.fn() } as any;
    repo = { findById: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayoutController],
      providers: [
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
        { provide: InitiatePayoutUseCase, useValue: initiatePayout },
        { provide: GetPayoutStatusUseCase, useValue: getStatus },
        { provide: GetPayoutStatsUseCase, useValue: getStats },
        { provide: ListPayoutsUseCase, useValue: listUseCase },
        { provide: PayoutRepository, useValue: repo },
      ],
    }).compile();

    controller = module.get(PayoutController);
  });

  it("is defined", () => {
    expect(controller).toBeDefined();
  });

  it("GET /payout/methods returns methods", () => {
    const result = controller.getMethods("fr");
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("POST /payout/initiate calls initiatePayout", async () => {
    const dto = { paymentId: "pay_1", orderId: "ord_1", producteurId: "prod_1", amount: 150000, method: "mobile_money", provider: "mtn_momo", phone: "+22961010101" };
    const expected = { success: true, data: { id: "p1", status: "completed" } };
    initiatePayout.execute.mockResolvedValue(expected as any);

    const result = await controller.initiate(dto as any);
    expect(result).toEqual(expected);
    expect(initiatePayout.execute).toHaveBeenCalledWith({
      paymentId: "pay_1",
      orderId: "ord_1",
      producteurId: "prod_1",
      amount: 150000,
      currency: undefined,
      method: "mobile_money",
      provider: "mtn_momo",
      phone: "+22961010101",
      idempotencyKey: undefined,
    });
  });

  it("GET /payout/:id returns payout by id", async () => {
    const payout = { id: "p1", status: "completed" };
    repo.findById.mockResolvedValue(payout as any);
    const result = await controller.getPayout("p1");
    expect(result.success).toBe(true);
    expect(result.data).toEqual(payout);
  });

  it("GET /payouts calls listPayouts", async () => {
    listUseCase.execute.mockResolvedValue({ success: true, data: [] });
    const result = await controller.listPayouts({} as any);
    expect(result.success).toBe(true);
  });

  it("GET /payout/stats calls stats", async () => {
    getStats.execute.mockResolvedValue({ success: true, data: { totalDisbursed: 0 } });
    const result = await controller.stats();
    expect(result.success).toBe(true);
  });

  it("POST /payout/:id/check-status calls checkPayoutStatus", async () => {
    getStatus.execute.mockResolvedValue({ success: true, data: { status: "completed" } });
    const result = await controller.checkPayoutStatus("p1");
    expect(result.success).toBe(true);
  });
});
