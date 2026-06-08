import { Injectable, Logger, BadRequestException } from "@nestjs/common";

export enum DisputeResolution {
  RELEASE_TO_SELLER = "release_to_seller",
  REFUND_BUYER = "refund_buyer",
  SPLIT = "split",
}

export interface DisputeCase {
  escrowId: string;
  orderId: string;
  buyerId: string;
  producteurId: string;
  amount: number;
  reason: string;
  raisedBy: string;
  evidence?: string;
}

export interface ResolutionResult {
  resolution: DisputeResolution;
  sellerAmount: number;
  buyerAmount: number;
  platformFee: number;
  notes: string;
}

@Injectable()
export class DisputeResolutionService {
  private readonly logger = new Logger(DisputeResolutionService.name);

  resolve(case_: DisputeCase, resolution: DisputeResolution, adminId: string): ResolutionResult {
    switch (resolution) {
      case DisputeResolution.RELEASE_TO_SELLER:
        return {
          resolution,
          sellerAmount: case_.amount,
          buyerAmount: 0,
          platformFee: 0,
          notes: `Funds released to seller. Resolved by ${adminId}.`,
        };

      case DisputeResolution.REFUND_BUYER:
        return {
          resolution,
          sellerAmount: 0,
          buyerAmount: case_.amount,
          platformFee: 0,
          notes: `Funds refunded to buyer. Resolved by ${adminId}.`,
        };

      case DisputeResolution.SPLIT: {
        const platformFee = Math.round(case_.amount * 0.02 * 100) / 100;
        const remainder = case_.amount - platformFee;
        const half = Math.round((remainder / 2) * 100) / 100;
        return {
          resolution,
          sellerAmount: half,
          buyerAmount: remainder - half,
          platformFee,
          notes: `Split resolution: seller gets ${half}, buyer gets ${remainder - half}, platform fee ${platformFee}. Resolved by ${adminId}.`,
        };
      }

      default:
        throw new BadRequestException(`Unknown resolution: ${resolution}`);
    }
  }
}
