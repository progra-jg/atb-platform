import { PayoutMethod, PayoutProviderId, PayoutCurrency } from "./types";

export interface PayoutProviderConfig {
  id: PayoutProviderId;
  name: Record<string, string>;
  currencies: PayoutCurrency[];
  processingTime: string;
  feePercentage: number;
  feeCap?: number;
  minAmount: number;
  maxAmount: number;
}

export interface PayoutMethodConfig {
  id: PayoutMethod;
  label: Record<string, string>;
  icon: string;
  providers: PayoutProviderConfig[];
  supportsWebhook: boolean;
}

export const PAYOUT_METHOD_CONFIGS: PayoutMethodConfig[] = [
  {
    id: PayoutMethod.MOBILE_MONEY,
    label: { fr: "Mobile Money", en: "Mobile Money" },
    icon: "Smartphone",
    supportsWebhook: true,
    providers: [
      { id: PayoutProviderId.MTN_MOMO, name: { fr: "MTN MoMo", en: "MTN MoMo" }, currencies: [PayoutCurrency.XOF], processingTime: "instant", feePercentage: 0.5, minAmount: 100, maxAmount: 5_000_000 },
      { id: PayoutProviderId.MOOV_FLOOZ, name: { fr: "Moov Flooz", en: "Moov Flooz" }, currencies: [PayoutCurrency.XOF], processingTime: "instant", feePercentage: 0.5, minAmount: 100, maxAmount: 5_000_000 },
      { id: PayoutProviderId.ORANGE_MONEY, name: { fr: "Orange Money", en: "Orange Money" }, currencies: [PayoutCurrency.XOF], processingTime: "instant", feePercentage: 0.5, minAmount: 100, maxAmount: 5_000_000 },
    ],
  },
];

export class PayoutMethodFactory {
  static getMethodConfig(method: PayoutMethod): PayoutMethodConfig {
    const config = PAYOUT_METHOD_CONFIGS.find(m => m.id === method);
    if (!config) throw new Error(`Unknown payout method: ${method}`);
    return config;
  }

  static getProviderConfig(method: PayoutMethod, provider: PayoutProviderId): PayoutProviderConfig {
    const methodConfig = this.getMethodConfig(method);
    const providerConfig = methodConfig.providers.find(p => p.id === provider);
    if (!providerConfig) throw new Error(`Unknown payout provider ${provider} for method ${method}`);
    return providerConfig;
  }

  static validateAmount(method: PayoutMethod, provider: PayoutProviderId, amount: number): void {
    const config = this.getProviderConfig(method, provider);
    if (amount < config.minAmount || amount > config.maxAmount) {
      throw new Error(`Amount ${amount} out of range [${config.minAmount}, ${config.maxAmount}] for ${provider}`);
    }
  }

  static getMethods(lang: string) {
    return PAYOUT_METHOD_CONFIGS.map(m => ({
      id: m.id,
      label: m.label[lang] ?? m.label.fr,
      icon: m.icon,
      providers: m.providers.map(p => ({
        id: p.id,
        name: p.name[lang] ?? p.name.fr,
        currencies: p.currencies,
        processingTime: p.processingTime,
        fee: `${p.feePercentage}%`,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
      })),
    }));
  }
}
