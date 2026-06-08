import {
  PayoutStatus,
  PayoutStateMachine,
  InvalidPayoutTransitionError,
  PayoutMethod,
  PayoutProviderId,
  PayoutCurrency,
  PAYOUT_TRANSITIONS,
  PAYOUT_TERMINAL_STATUSES,
} from "../types";

describe("PayoutStateMachine", () => {
  describe("canTransition", () => {
    it.each([
      [PayoutStatus.PENDING, PayoutStatus.PROCESSING, true],
      [PayoutStatus.PENDING, PayoutStatus.CANCELLED, true],
      [PayoutStatus.PENDING, PayoutStatus.COMPLETED, false],
      [PayoutStatus.PENDING, PayoutStatus.FAILED, false],
      [PayoutStatus.PROCESSING, PayoutStatus.COMPLETED, true],
      [PayoutStatus.PROCESSING, PayoutStatus.FAILED, true],
      [PayoutStatus.PROCESSING, PayoutStatus.PENDING, false],
      [PayoutStatus.COMPLETED, PayoutStatus.PROCESSING, false],
      [PayoutStatus.COMPLETED, PayoutStatus.FAILED, false],
      [PayoutStatus.FAILED, PayoutStatus.PROCESSING, true],
      [PayoutStatus.CANCELLED, PayoutStatus.PENDING, false],
      [PayoutStatus.CANCELLED, PayoutStatus.PROCESSING, false],
    ])("from %s to %s → %s", (from, to, expected) => {
      expect(PayoutStateMachine.canTransition(from, to)).toBe(expected);
    });
  });

  describe("transition", () => {
    it("returns target status for valid transitions", () => {
      expect(PayoutStateMachine.transition(PayoutStatus.PENDING, PayoutStatus.PROCESSING)).toBe(PayoutStatus.PROCESSING);
    });

    it("throws InvalidPayoutTransitionError for invalid transitions", () => {
      expect(() =>
        PayoutStateMachine.transition(PayoutStatus.COMPLETED, PayoutStatus.FAILED)
      ).toThrow(InvalidPayoutTransitionError);
    });
  });

  describe("isTerminal", () => {
    it("returns true for completed status", () => {
      expect(PayoutStateMachine.isTerminal(PayoutStatus.COMPLETED)).toBe(true);
    });

    it("returns true for cancelled status", () => {
      expect(PayoutStateMachine.isTerminal(PayoutStatus.CANCELLED)).toBe(true);
    });

    it("returns false for non-terminal statuses", () => {
      expect(PayoutStateMachine.isTerminal(PayoutStatus.PENDING)).toBe(false);
      expect(PayoutStateMachine.isTerminal(PayoutStatus.PROCESSING)).toBe(false);
      expect(PayoutStateMachine.isTerminal(PayoutStatus.FAILED)).toBe(false);
    });
  });

  describe("PAYOUT_TRANSITIONS map invariants", () => {
    it("every from-status appears exactly once", () => {
      for (const s of Object.values(PayoutStatus)) {
        expect(PAYOUT_TRANSITIONS.has(s)).toBe(true);
      }
    });

    it("terminal statuses have empty target arrays", () => {
      for (const s of PAYOUT_TERMINAL_STATUSES) {
        expect(PAYOUT_TRANSITIONS.get(s)).toEqual([]);
      }
    });
  });
});

describe("PayoutMethod", () => {
  it("MOBILE_MONEY has string value 'mobile_money'", () => {
    expect(PayoutMethod.MOBILE_MONEY).toBe("mobile_money");
  });
});

describe("PayoutProviderId", () => {
  it("contains expected providers", () => {
    expect(PayoutProviderId.MTN_MOMO).toBe("mtn_momo");
    expect(PayoutProviderId.MOOV_FLOOZ).toBe("moov_flooz");
    expect(PayoutProviderId.ORANGE_MONEY).toBe("orange_money");
  });
});

describe("PayoutCurrency", () => {
  it("is XOF", () => {
    expect(PayoutCurrency.XOF).toBe("XOF");
  });
});
