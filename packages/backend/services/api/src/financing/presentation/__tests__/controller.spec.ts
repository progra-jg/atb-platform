import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { FinancingController } from "../controller";
import { JwtAuthGuard } from "../../../guards/jwt-auth.guard";
import {
  CheckEligibility,
  ApplyForFinancing,
  ProcessRepayment,
  GetActiveContracts,
  GetContractById,
} from "../../application/usecases";

describe("FinancingController", () => {
  let controller: FinancingController;
  let checkEligibility: jest.Mocked<CheckEligibility>;
  let applyForFinancing: jest.Mocked<ApplyForFinancing>;
  let processRepayment: jest.Mocked<ProcessRepayment>;
  let getActiveContracts: jest.Mocked<GetActiveContracts>;
  let getContractById: jest.Mocked<GetContractById>;

  beforeEach(async () => {
    checkEligibility = { execute: jest.fn() } as any;
    applyForFinancing = { execute: jest.fn() } as any;
    processRepayment = { execute: jest.fn() } as any;
    getActiveContracts = { execute: jest.fn() } as any;
    getContractById = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancingController],
      providers: [
        { provide: JwtAuthGuard, useValue: { canActivate: jest.fn(() => true) } },
        { provide: CheckEligibility, useValue: checkEligibility },
        { provide: ApplyForFinancing, useValue: applyForFinancing },
        { provide: ProcessRepayment, useValue: processRepayment },
        { provide: GetActiveContracts, useValue: getActiveContracts },
        { provide: GetContractById, useValue: getContractById },
      ],
    }).compile();

    controller = module.get(FinancingController);
  });

  it("is defined", () => {
    expect(controller).toBeDefined();
  });

  it("GET /financing/eligibility calls checkEligibility", async () => {
    checkEligibility.execute.mockResolvedValue({ eligible: true } as any);
    const result = await controller.eligibility({ producteurId: "prod_1", trustScore: 650 } as any);
    expect(checkEligibility.execute).toHaveBeenCalledWith("prod_1", 650);
  });

  it("POST /financing/apply calls applyForFinancing", async () => {
    applyForFinancing.execute.mockResolvedValue({ id: "c1" } as any);
    const dto = { offerId: "offer_transport", amount: 200000, collateralType: "harvest", collateralRef: "REF" };
    const result = await controller.apply(dto, "prod_1", "650");
    expect(applyForFinancing.execute).toHaveBeenCalledWith("prod_1", "offer_transport", 200000, 650, "harvest", "REF");
  });

  it("POST /financing/:id/repay calls processRepayment", async () => {
    processRepayment.execute.mockResolvedValue({ id: "c1" } as any);
    const dto = { amount: 73334, transactionRef: "txn_1" };
    const result = await controller.repay("c1", dto);
    expect(processRepayment.execute).toHaveBeenCalledWith("c1", 73334, "txn_1");
  });

  it("GET /financing/active/:producteurId calls getActiveContracts", async () => {
    getActiveContracts.execute.mockResolvedValue([]);
    const result = await controller.activeContracts("prod_1");
    expect(getActiveContracts.execute).toHaveBeenCalledWith("prod_1");
  });

  it("GET /financing/:id calls getContractById", async () => {
    getContractById.execute.mockResolvedValue({ id: "c1" } as any);
    const result = await controller.getContract("c1");
    expect(getContractById.execute).toHaveBeenCalledWith("c1");
  });
});
