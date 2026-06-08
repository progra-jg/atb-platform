import { EscrowCurrency, EscrowNetwork } from "./types";

export interface BlockchainWalletConfig {
  address: string;
  network: EscrowNetwork;
  currency: EscrowCurrency;
}

export interface EscrowFeeConfig {
  defaultFeePercentage: number;
  minFee: number;
  maxFee: number;
  platformWallet: string;
}

export const ESCROW_FEE_CONFIG: EscrowFeeConfig = {
  defaultFeePercentage: 0.5,
  minFee: 1,
  maxFee: 1000,
  platformWallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
};

export const BLOCKCHAIN_WALLETS: Record<string, BlockchainWalletConfig> = {
  [EscrowCurrency.USDT]: {
    address: "TR7Nh7H8J6jRkX5L3p2Qb9Z1zY4Wq8EuVc",
    network: EscrowNetwork.TRC20,
    currency: EscrowCurrency.USDT,
  },
  [EscrowCurrency.USDC]: {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    network: EscrowNetwork.POLYGON,
    currency: EscrowCurrency.USDC,
  },
};

export const NETWORK_CONFIGS: Record<string, { chainId: number; explorerUrl: string; confirmationBlocks: number }> = {
  [EscrowNetwork.TRC20]: { chainId: 1, explorerUrl: "https://tronscan.org/#/contract/", confirmationBlocks: 19 },
  [EscrowNetwork.POLYGON]: { chainId: 137, explorerUrl: "https://polygonscan.com/address/", confirmationBlocks: 64 },
  [EscrowNetwork.BEP20]: { chainId: 56, explorerUrl: "https://bscscan.com/address/", confirmationBlocks: 15 },
};

export const DEFAULT_TERMS_TEMPLATE = JSON.stringify({
  deliveryDeadlineDays: 14,
  inspectionPeriodDays: 7,
  autoRelease: true,
  partialDeliveryAllowed: false,
  qualityStandards: "Good Agricultural Practices (GAP)",
});

export class EscrowConfigFactory {
  static getWalletConfig(currency: string): BlockchainWalletConfig {
    const config = BLOCKCHAIN_WALLETS[currency];
    if (!config) throw new Error(`No wallet configured for currency: ${currency}`);
    return config;
  }

  static getNetworkConfig(network: string) {
    const config = NETWORK_CONFIGS[network];
    if (!config) throw new Error(`No network config for: ${network}`);
    return config;
  }

  static calculateFee(amount: number, feePercentage?: number): number {
    const pct = feePercentage ?? ESCROW_FEE_CONFIG.defaultFeePercentage;
    const fee = (amount * pct) / 100;
    return Math.max(ESCROW_FEE_CONFIG.minFee, Math.min(fee, ESCROW_FEE_CONFIG.maxFee));
  }

  static getPlatformWallet(): string {
    return ESCROW_FEE_CONFIG.platformWallet;
  }
}
