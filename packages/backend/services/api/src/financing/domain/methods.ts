import type { FinancingOffer, FinancingContract, RepaymentSchedule, CollateralType } from "./types";

export function generateSchedule(amount: number, interestRate: number, durationDays: number): RepaymentSchedule[] {
  const totalInterest = amount * (interestRate / 100);
  const totalRepayable = amount + totalInterest;
  const installments = Math.ceil(durationDays / 30);
  const perInstallment = Math.round(totalRepayable / installments);
  const schedule: RepaymentSchedule[] = [];

  for (let i = 0; i < installments; i++) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (i + 1) * 30);
    schedule.push({
      dueDate,
      amount: i === installments - 1 ? totalRepayable - perInstallment * (installments - 1) : perInstallment,
      status: "pending",
    });
  }

  return schedule;
}

export function computeTotalRepayable(amount: number, interestRate: number): number {
  return amount + amount * (interestRate / 100);
}

export function computePenalty(overdueDays: number, installmentAmount: number): number {
  const dailyRate = 0.005;
  return Math.round(installmentAmount * dailyRate * overdueDays);
}

export const INPUT_TYPES = {
  seeds_maize: { label: "Semences maïs", maxAmount: 150000, interestRate: 8, durationDays: 180, minTrustScore: 600 },
  seeds_rice: { label: "Semences riz", maxAmount: 200000, interestRate: 8, durationDays: 180, minTrustScore: 600 },
  fertilizer: { label: "Engrais NPK", maxAmount: 250000, interestRate: 7, durationDays: 150, minTrustScore: 650 },
  pesticide: { label: "Pesticides", maxAmount: 100000, interestRate: 9, durationDays: 120, minTrustScore: 600 },
  equipment: { label: "Petit équipement", maxAmount: 500000, interestRate: 6, durationDays: 365, minTrustScore: 700 },
  transport: { label: "Crédit transport", maxAmount: 300000, interestRate: 10, durationDays: 90, minTrustScore: 550 },
  storage: { label: "Stockage & conservation", maxAmount: 200000, interestRate: 8, durationDays: 180, minTrustScore: 650 },
  irrigation: { label: "Kit irrigation", maxAmount: 350000, interestRate: 6, durationDays: 365, minTrustScore: 700 },
  certification: { label: "Certification Bio/EUDR", maxAmount: 400000, interestRate: 5, durationDays: 365, minTrustScore: 750 },
  labor: { label: "Main-d'œuvre", maxAmount: 150000, interestRate: 10, durationDays: 90, minTrustScore: 550 },
};

export function defaultOffers(): FinancingOffer[] {
  return Object.entries(INPUT_TYPES).map(([key, val]) => ({
    id: `offer_${key}`,
    inputType: key,
    label: val.label,
    maxAmount: val.maxAmount,
    interestRate: val.interestRate,
    durationDays: val.durationDays,
    minTrustScore: val.minTrustScore,
    collateralRequired: key === "certification" ? ["harvest"] : key === "equipment" ? ["harvest", "guarantor"] : ["harvest"],
    active: true,
  }));
}
