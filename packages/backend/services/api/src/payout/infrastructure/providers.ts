import { Injectable, Logger } from "@nestjs/common";
import { PayoutProviderId, PayoutId, PayoutStatus } from "../domain/types";

export interface PayoutProviderInitiateResult {
  success: boolean;
  providerRef?: string;
  status: PayoutStatus;
}

export interface PayoutProviderStatusResult {
  status: PayoutStatus;
  providerRef?: string;
}

export interface IPayoutProvider {
  readonly id: PayoutProviderId;
  disburse(amount: number, currency: string, phone: string, payoutId: PayoutId, metadata?: Record<string, unknown>): Promise<PayoutProviderInitiateResult>;
  checkStatus(providerRef: string): Promise<PayoutProviderStatusResult>;
}

class MockPayoutProvider implements IPayoutProvider {
  readonly id = PayoutProviderId.MTN_MOMO;

  async disburse(amount: number, currency: string, phone: string, payoutId: PayoutId): Promise<PayoutProviderInitiateResult> {
    return {
      success: true,
      providerRef: `PO_${Date.now()}_${payoutId.slice(0, 8)}`,
      status: PayoutStatus.COMPLETED,
    };
  }

  async checkStatus(): Promise<PayoutProviderStatusResult> {
    return { status: PayoutStatus.COMPLETED };
  }
}

class MockMoovPayoutProvider implements IPayoutProvider {
  readonly id = PayoutProviderId.MOOV_FLOOZ;

  async disburse(amount: number, currency: string, phone: string, payoutId: PayoutId): Promise<PayoutProviderInitiateResult> {
    return {
      success: true,
      providerRef: `PO_MV_${Date.now()}_${payoutId.slice(0, 8)}`,
      status: PayoutStatus.COMPLETED,
    };
  }

  async checkStatus(): Promise<PayoutProviderStatusResult> {
    return { status: PayoutStatus.COMPLETED };
  }
}

class MockOrangePayoutProvider implements IPayoutProvider {
  readonly id = PayoutProviderId.ORANGE_MONEY;

  async disburse(amount: number, currency: string, phone: string, payoutId: PayoutId): Promise<PayoutProviderInitiateResult> {
    return {
      success: true,
      providerRef: `PO_OM_${Date.now()}_${payoutId.slice(0, 8)}`,
      status: PayoutStatus.COMPLETED,
    };
  }

  async checkStatus(): Promise<PayoutProviderStatusResult> {
    return { status: PayoutStatus.COMPLETED };
  }
}

@Injectable()
export class PayoutProviderRegistry {
  private readonly providers = new Map<PayoutProviderId, IPayoutProvider>();
  private readonly logger = new Logger(PayoutProviderRegistry.name);

  constructor() {
    this.register(new MockPayoutProvider());
    this.register(new MockMoovPayoutProvider());
    this.register(new MockOrangePayoutProvider());
  }

  register(provider: IPayoutProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: PayoutProviderId): IPayoutProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`No payout provider registered for: ${providerId}`);
    return provider;
  }

  getAll(): IPayoutProvider[] {
    return Array.from(this.providers.values());
  }
}
