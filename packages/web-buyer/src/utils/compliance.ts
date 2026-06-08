import type { Order, FarmerProfile, Lot } from "../types";

export interface BondRequirement {
  required: number;
  deposited: number;
  shortfall: number;
  met: boolean;
  releaseDate: string | null;
}

export interface ComplianceVerification {
  eudrCompliant: boolean;
  certificationsValid: boolean;
  didVerified: boolean;
  bondMet: boolean;
  allPassed: boolean;
  bondDetails: BondRequirement | null;
}

const BOND_RATE = 0.1;

export function computeBondRequirement(order: Order): BondRequirement {
  const totalStr = order.total.replace(/[^\d]/g, "");
  const totalValue = parseFloat(totalStr) || 0;
  const required = Math.round(totalValue * BOND_RATE);
  const deposited = order.escrowDeposit ?? 0;
  const shortfall = Math.max(0, required - deposited);
  return {
    required,
    deposited,
    shortfall,
    met: deposited >= required,
    releaseDate: order.escrowReleaseDate ?? null,
  };
}

export function verifyCompliance(
  farmer: FarmerProfile,
  order: Order | null,
  lots: Lot[]
): ComplianceVerification {
  const eudrCompliant = farmer.eudr?.compliant ?? false;
  const certificationsValid = (farmer.certifications ?? []).some(
    (c) => c.statut === "Valide"
  );
  const didVerified = farmer.didVerified ?? false;
  const bondDetails = order ? computeBondRequirement(order) : null;
  const bondMet = bondDetails ? bondDetails.met : true;

  return {
    eudrCompliant,
    certificationsValid,
    didVerified,
    bondMet,
    allPassed: eudrCompliant && certificationsValid && didVerified && bondMet,
    bondDetails,
  };
}

export function estimatePremiumBond(
  totalValue: number,
  farmerTrustScore: number
): number {
  const riskPremium = Math.max(0.05, BOND_RATE * (1 - farmerTrustScore / 100));
  return Math.round(totalValue * riskPremium);
}
