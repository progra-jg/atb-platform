import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { FarmerProfile } from "./profiles/farmer-profile.entity";
import { BuyerProfile } from "./profiles/buyer-profile.entity";

describe("AuthService", () => {
  let service: AuthService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };
  const mockJwt = { sign: jest.fn().mockReturnValue("token") };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(FarmerProfile), useValue: mockRepo },
        { provide: getRepositoryToken(BuyerProfile), useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
