import { PaymentMethod, PaymentProviderId, Currency } from "./types";

export interface ProviderConfig {
  id: PaymentProviderId;
  name: Record<string, string>;
  currencies: Currency[];
  processingTime: string;
  feePercentage: number;
  feeCap?: number;
  minAmount: number;
  maxAmount: number;
}

export interface PaymentMethodConfig {
  id: PaymentMethod;
  label: Record<string, string>;
  icon: string;
  providers: ProviderConfig[];
  requiresRedirect: boolean;
  supportsWebhook: boolean;
  verificationRequired: boolean;
}

export const METHOD_CONFIGS: PaymentMethodConfig[] = [
  {
    id: PaymentMethod.MOBILE_MONEY,
    label: { fr: "Mobile Money", en: "Mobile Money" },
    icon: "Smartphone",
    requiresRedirect: true,
    supportsWebhook: true,
    verificationRequired: false,
    providers: [
      { id: PaymentProviderId.MTN_MOMO, name: { fr: "MTN MoMo", en: "MTN MoMo" }, currencies: [Currency.XOF], processingTime: "instant", feePercentage: 0.8, minAmount: 100, maxAmount: 5_000_000 },
      { id: PaymentProviderId.MOOV_FLOOZ, name: { fr: "Moov Flooz", en: "Moov Flooz" }, currencies: [Currency.XOF], processingTime: "instant", feePercentage: 0.8, minAmount: 100, maxAmount: 5_000_000 },
      { id: PaymentProviderId.ORANGE_MONEY, name: { fr: "Orange Money", en: "Orange Money" }, currencies: [Currency.XOF], processingTime: "instant", feePercentage: 0.8, minAmount: 100, maxAmount: 5_000_000 },
    ],
  },
  {
    id: PaymentMethod.CARD,
    label: { fr: "Carte bancaire", en: "Bank card" },
    icon: "CreditCard",
    requiresRedirect: true,
    supportsWebhook: true,
    verificationRequired: false,
    providers: [
      { id: PaymentProviderId.FEDAPAY, name: { fr: "FedaPay", en: "FedaPay" }, currencies: [Currency.XOF], processingTime: "instant", feePercentage: 1.5, minAmount: 500, maxAmount: 10_000_000 },
      { id: PaymentProviderId.CINETPAY, name: { fr: "CinetPay", en: "CinetPay" }, currencies: [Currency.XOF], processingTime: "instant", feePercentage: 1.5, minAmount: 500, maxAmount: 10_000_000 },
    ],
  },
  {
    id: PaymentMethod.BANK_TRANSFER,
    label: { fr: "Virement bancaire", en: "Bank transfer" },
    icon: "Bank",
    requiresRedirect: false,
    supportsWebhook: false,
    verificationRequired: true,
    providers: [
      { id: PaymentProviderId.BANK_XOF, name: { fr: "Banque locale (XOF)", en: "Local bank (XOF)" }, currencies: [Currency.XOF], processingTime: "24-48h", feePercentage: 0, minAmount: 100_000, maxAmount: 50_000_000 },
    ],
  },
  {
    id: PaymentMethod.CRYPTO,
    label: { fr: "Cryptomonnaie", en: "Cryptocurrency" },
    icon: "CurrencyCircleDollar",
    requiresRedirect: false,
    supportsWebhook: false,
    verificationRequired: false,
    providers: [
      { id: PaymentProviderId.USDT_TRC20, name: { fr: "USDT (TRC-20)", en: "USDT (TRC-20)" }, currencies: [Currency.USDT], processingTime: "5-15 min", feePercentage: 0.5, minAmount: 50_000, maxAmount: 100_000_000 },
      { id: PaymentProviderId.USDC_POLYGON, name: { fr: "USDC (Polygon)", en: "USDC (Polygon)" }, currencies: [Currency.USDC], processingTime: "5-15 min", feePercentage: 0.5, minAmount: 50_000, maxAmount: 100_000_000 },
    ],
  },
];

export class PaymentMethodFactory {
  static getMethodConfig(method: PaymentMethod): PaymentMethodConfig {
    const config = METHOD_CONFIGS.find(m => m.id === method);
    if (!config) throw new Error(`Unknown payment method: ${method}`);
    return config;
  }

  static getProviderConfig(method: PaymentMethod, provider: PaymentProviderId): ProviderConfig {
    const methodConfig = this.getMethodConfig(method);
    const providerConfig = methodConfig.providers.find(p => p.id === provider);
    if (!providerConfig) throw new Error(`Unknown provider ${provider} for method ${method}`);
    return providerConfig;
  }

  static validateAmount(method: PaymentMethod, provider: PaymentProviderId, amount: number): void {
    const config = this.getProviderConfig(method, provider);
    if (amount < config.minAmount || amount > config.maxAmount) {
      throw new Error(`Amount ${amount} out of range [${config.minAmount}, ${config.maxAmount}] for ${provider}`);
    }
  }

  static getMethods(lang: string) {
    return METHOD_CONFIGS.map(m => ({
      id: m.id,
      label: m.label[lang] ?? m.label["fr"],
      icon: m.icon,
      providers: m.providers.map(p => ({
        id: p.id,
        name: p.name[lang] ?? p.name["fr"],
        currencies: p.currencies,
        processingTime: p.processingTime,
        fee: `${p.feePercentage}%`,
        minAmount: p.minAmount,
        maxAmount: p.maxAmount,
      })),
    }));
  }

  static getBankDetails() {
    return {
      bankName: "Bank of Africa Bénin",
      accountName: "AgriTrace Bénin SARL",
      accountNumber: "BJ123 45678 90123456789 01",
      swift: "BOFABJBB",
      rib: "BJ06 12345 67890 1234567890 12",
    };
  }

  static getCryptoWallets(): Record<string, { address: string; network: string }> {
    return {
      [PaymentProviderId.USDT_TRC20]: { address: "TR7Nh7H8J6jRkX5L3p2Qb9Z1zY4Wq8EuVc", network: "TRC-20" },
      [PaymentProviderId.USDC_POLYGON]: { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", network: "Polygon" },
    };
  }
}
