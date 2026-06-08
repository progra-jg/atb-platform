import { PayoutMethodFactory } from "../methods";
import { PayoutMethod, PayoutProviderId } from "../types";

describe("PayoutMethodFactory", () => {
  describe("getMethodConfig", () => {
    it("returns config for MOBILE_MONEY", () => {
      const config = PayoutMethodFactory.getMethodConfig(PayoutMethod.MOBILE_MONEY);
      expect(config.id).toBe(PayoutMethod.MOBILE_MONEY);
      expect(config.providers).toHaveLength(3);
    });

    it("throws for unknown method", () => {
      expect(() =>
        (PayoutMethodFactory as any).getMethodConfig("unknown_method")
      ).toThrow("Unknown payout method");
    });
  });

  describe("getProviderConfig", () => {
    it("returns MTN config", () => {
      const config = PayoutMethodFactory.getProviderConfig(
        PayoutMethod.MOBILE_MONEY,
        PayoutProviderId.MTN_MOMO
      );
      expect(config.id).toBe(PayoutProviderId.MTN_MOMO);
      expect(config.minAmount).toBe(100);
      expect(config.maxAmount).toBe(5_000_000);
      expect(config.feePercentage).toBe(0.5);
    });

    it("returns Moov config", () => {
      const config = PayoutMethodFactory.getProviderConfig(
        PayoutMethod.MOBILE_MONEY,
        PayoutProviderId.MOOV_FLOOZ
      );
      expect(config.id).toBe(PayoutProviderId.MOOV_FLOOZ);
    });

    it("returns Orange config", () => {
      const config = PayoutMethodFactory.getProviderConfig(
        PayoutMethod.MOBILE_MONEY,
        PayoutProviderId.ORANGE_MONEY
      );
      expect(config.id).toBe(PayoutProviderId.ORANGE_MONEY);
    });

    it("throws for unknown provider", () => {
      expect(() =>
        PayoutMethodFactory.getProviderConfig(PayoutMethod.MOBILE_MONEY, "unknown" as any)
      ).toThrow("Unknown payout provider");
    });
  });

  describe("validateAmount", () => {
    const validProvider: [string, PayoutProviderId, number, number][] = [
      ["MTN", PayoutProviderId.MTN_MOMO, 100, true],
      ["MTN", PayoutProviderId.MTN_MOMO, 5_000_000, true],
      ["MTN", PayoutProviderId.MTN_MOMO, 250_000, true],
      ["MTN", PayoutProviderId.MTN_MOMO, 99, false],
      ["MTN", PayoutProviderId.MTN_MOMO, 5_000_001, false],
    ];

    it.each(validProvider)("%s: amount %d → valid=%s", (_, provider, amount, valid) => {
      const action = () =>
        PayoutMethodFactory.validateAmount(PayoutMethod.MOBILE_MONEY, provider, amount);
      if (valid) {
        expect(action).not.toThrow();
      } else {
        expect(action).toThrow("out of range");
      }
    });
  });

  describe("getMethods", () => {
    it("returns methods with French labels", () => {
      const methods = PayoutMethodFactory.getMethods("fr");
      expect(methods).toHaveLength(1);
      expect(methods[0].providers).toHaveLength(3);
      expect(methods[0].providers[0].name).toBe("MTN MoMo");
    });

    it("returns methods with English labels", () => {
      const methods = PayoutMethodFactory.getMethods("en");
      expect(methods[0].label).toBe("Mobile Money");
    });

    it("falls back to French for unknown lang", () => {
      const methods = PayoutMethodFactory.getMethods("de");
      expect(methods[0].label).toBe("Mobile Money");
    });

    it("includes fee, minAmount, maxAmount for each provider", () => {
      const methods = PayoutMethodFactory.getMethods("fr");
      const provider = methods[0].providers[0];
      expect(provider.fee).toBe("0.5%");
      expect(provider.minAmount).toBe(100);
      expect(provider.maxAmount).toBe(5_000_000);
      expect(provider.currencies).toEqual(["XOF"]);
      expect(provider.processingTime).toBe("instant");
    });
  });
});
