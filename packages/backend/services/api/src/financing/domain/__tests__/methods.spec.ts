import {
  generateSchedule,
  computeTotalRepayable,
  computePenalty,
  defaultOffers,
  INPUT_TYPES,
} from "../methods";

describe("generateSchedule", () => {
  it("generates correct number of installments for 180 days", () => {
    const schedule = generateSchedule(100000, 8, 180);
    expect(schedule).toHaveLength(6);
  });

  it("generates correct number of installments for 365 days", () => {
    const schedule = generateSchedule(500000, 6, 365);
    expect(schedule).toHaveLength(13);
  });

  it("sum of all installments equals total repayable", () => {
    const amount = 200000;
    const rate = 8;
    const schedule = generateSchedule(amount, rate, 180);
    const totalInSchedule = schedule.reduce((s, r) => s + r.amount, 0);
    expect(totalInSchedule).toBe(computeTotalRepayable(amount, rate));
  });

  it("all installments have status 'pending'", () => {
    const schedule = generateSchedule(100000, 8, 180);
    for (const r of schedule) {
      expect(r.status).toBe("pending");
    }
  });

  it("installment dueDates are in ascending order", () => {
    const schedule = generateSchedule(100000, 8, 180);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].dueDate.getTime()).toBeGreaterThan(schedule[i - 1].dueDate.getTime());
    }
  });

  it("each installment has positive amount", () => {
    const schedule = generateSchedule(10000, 5, 90);
    for (const r of schedule) {
      expect(r.amount).toBeGreaterThan(0);
    }
  });
});

describe("computeTotalRepayable", () => {
  it("calculates correctly for 8% on 100000", () => {
    expect(computeTotalRepayable(100000, 8)).toBe(108000);
  });

  it("calculates correctly for 0%", () => {
    expect(computeTotalRepayable(50000, 0)).toBe(50000);
  });

  it("calculates correctly for 100%", () => {
    expect(computeTotalRepayable(1000, 100)).toBe(2000);
  });
});

describe("computePenalty", () => {
  it("returns 0 for 0 overdue days", () => {
    expect(computePenalty(0, 10000)).toBe(0);
  });

  it("calculates 0.5% per day correctly", () => {
    const amount = 10000;
    const days = 10;
    expect(computePenalty(days, amount)).toBe(500);
  });

  it("rounds to integer", () => {
    expect(computePenalty(1, 333)).toBe(2);
  });

  it("applies penalty proportionally over long periods", () => {
    const amount = 50000;
    const days = 60;
    const expected = Math.round(50000 * 0.005 * 60);
    expect(computePenalty(days, amount)).toBe(expected);
  });
});

describe("INPUT_TYPES", () => {
  it("contains all 10 input types", () => {
    expect(Object.keys(INPUT_TYPES)).toHaveLength(10);
  });

  it("certification has highest trust score requirement", () => {
    expect(INPUT_TYPES.certification.minTrustScore).toBe(750);
  });

  it("transport has lowest trust score requirement", () => {
    expect(INPUT_TYPES.transport.minTrustScore).toBe(550);
  });
});

describe("defaultOffers", () => {
  it("returns 10 offers", () => {
    const offers = defaultOffers();
    expect(offers).toHaveLength(10);
  });

  it("each offer has required fields", () => {
    const offers = defaultOffers();
    for (const o of offers) {
      expect(o.id).toBeTruthy();
      expect(o.inputType).toBeTruthy();
      expect(o.label).toBeTruthy();
      expect(o.maxAmount).toBeGreaterThan(0);
      expect(o.interestRate).toBeGreaterThanOrEqual(0);
      expect(o.durationDays).toBeGreaterThan(0);
      expect(o.minTrustScore).toBeGreaterThanOrEqual(0);
      expect(o.active).toBe(true);
    }
  });

  it("each offer has non-empty collateralRequired", () => {
    const offers = defaultOffers();
    for (const o of offers) {
      expect(o.collateralRequired.length).toBeGreaterThan(0);
    }
  });

  it("offers are ordered as defined in INPUT_TYPES", () => {
    const offers = defaultOffers();
    const types = Object.keys(INPUT_TYPES);
    for (let i = 0; i < types.length; i++) {
      expect(offers[i].inputType).toBe(types[i]);
    }
  });
});
