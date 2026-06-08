import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe("AuthController", () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn().mockResolvedValue({ accessToken: "token", user: {} }),
    login: jest.fn().mockResolvedValue({ accessToken: "token", user: {} }),
    refresh: jest.fn().mockResolvedValue({ accessToken: "new_token" }),
    getProfile: jest.fn().mockResolvedValue({ id: "1", name: "Test" }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should register a user", async () => {
    const result = await controller.register({
      name: "Test", phone: "+22900000000",
      password: "pass123", role: "farmer",
    } as any);
    expect(result.accessToken).toEqual("token");
  });

  it("should login", async () => {
    const result = await controller.login({
      phone: "+22900000000", password: "pass123",
    } as any);
    expect(result.accessToken).toEqual("token");
  });
});
