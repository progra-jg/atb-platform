import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PaymentProviderId, PaymentId, PaymentStatus } from "../domain/types";
import { PaymentMethodFactory } from "../domain/methods";

export interface ProviderInitiateResult {
  success: boolean;
  providerRef?: string;
  paymentUrl?: string;
  qrCode?: string;
  invoiceNumber?: string;
  status: PaymentStatus;
  redirectUrl?: string;
}

export interface ProviderStatusResult {
  status: PaymentStatus;
  providerRef?: string;
  confirmations?: number;
}

export interface IPaymentProvider {
  readonly id: PaymentProviderId;
  initiate(amount: number, currency: string, paymentId: PaymentId, metadata?: Record<string, unknown>): Promise<ProviderInitiateResult>;
  checkStatus(providerRef: string): Promise<ProviderStatusResult>;
  verifyWebhook(payload: Record<string, unknown>, signature: string, timestamp?: string): boolean;
}

// Mock implementations for each provider
class MockMobileMoneyProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.MTN_MOMO;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, paymentUrl: `https://pay.atb.bj/checkout/${paymentId}`, status: PaymentStatus.PROCESSING, providerRef: `MM_${Date.now()}` };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED, confirmations: 1 }; }
  verifyWebhook(): boolean { return true; }
}

class MockOrangeMoneyProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.ORANGE_MONEY;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, paymentUrl: `https://pay.atb.bj/checkout/${paymentId}`, status: PaymentStatus.PROCESSING, providerRef: `OM_${Date.now()}` };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED, confirmations: 1 }; }
  verifyWebhook(): boolean { return true; }
}

class MockMoovFloozProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.MOOV_FLOOZ;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, paymentUrl: `https://pay.atb.bj/checkout/${paymentId}`, status: PaymentStatus.PROCESSING, providerRef: `FL_${Date.now()}` };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED, confirmations: 1 }; }
  verifyWebhook(): boolean { return true; }
}

class MockFedaPayProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.FEDAPAY;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, paymentUrl: `https://checkout.fedapay.com/${paymentId}`, status: PaymentStatus.PROCESSING, providerRef: `FD_${Date.now()}` };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED, confirmations: 1 }; }
  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean {
    return signature === `hmac_${payload.id || "test"}`;
  }
}

class MockCinetPayProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.CINETPAY;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, paymentUrl: `https://checkout.cinetpay.com/${paymentId}`, status: PaymentStatus.PROCESSING, providerRef: `CP_${Date.now()}` };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED, confirmations: 1 }; }
  verifyWebhook(): boolean { return true; }
}

class MockBankTransferProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.BANK_XOF;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    const invoiceNumber = `INV-${Date.now()}-${paymentId.slice(0, 6)}`;
    return { success: true, status: PaymentStatus.PROCESSING, invoiceNumber };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.PENDING }; }
  verifyWebhook(): boolean { return false; }
}

class MockCryptoProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.USDT_TRC20;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, status: PaymentStatus.PROCESSING, qrCode: `mock_qr_${paymentId}`, providerRef: null };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED }; }
  verifyWebhook(): boolean { return false; }
}

class MockUsdcPolygonProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.USDC_POLYGON;
  async initiate(amount: number, currency: string, paymentId: PaymentId): Promise<ProviderInitiateResult> {
    return { success: true, status: PaymentStatus.PROCESSING, qrCode: `mock_qr_${paymentId}`, providerRef: null };
  }
  async checkStatus(): Promise<ProviderStatusResult> { return { status: PaymentStatus.COMPLETED }; }
  verifyWebhook(): boolean { return false; }
}

class FedaPayProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.FEDAPAY;
  private readonly logger = new Logger(FedaPayProvider.name);
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly http: HttpService;

  constructor(http: HttpService) {
    this.http = http;
    this.apiKey = process.env.FEDAPAY_API_KEY || "";
    this.webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET || "";
    const sandbox = process.env.FEDAPAY_SANDBOX !== "false";
    this.baseUrl = sandbox ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async initiate(amount: number, currency: string, paymentId: PaymentId, metadata?: Record<string, unknown>): Promise<ProviderInitiateResult> {
    const body: Record<string, unknown> = {
      amount,
      currency: currency === "XOF" ? "XOF" : currency,
      description: `AgriTrace #${paymentId.slice(0, 8)}`,
      callback_url: `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/api/payment/webhook/fedapay`,
      mode: process.env.FEDAPAY_SANDBOX !== "false" ? "sandbox" : "live",
      reference: paymentId,
      metadata: { paymentId, ...metadata },
    };

    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/transactions`, body, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Request-ID": paymentId,
          },
        }),
      );
      const tx = data?.transaction || data;
      return {
        success: true,
        providerRef: String(tx.id || tx.reference || paymentId),
        paymentUrl: tx.payment_url || tx.url,
        status: PaymentStatus.PROCESSING,
      };
    } catch (err: any) {
      this.logger.error(`FedaPay initiate failed: ${err.message}`, err.response?.data);
      throw err;
    }
  }

  async checkStatus(providerRef: string): Promise<ProviderStatusResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/transactions/${providerRef}`, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
        }),
      );
      const tx = data?.transaction || data;
      const status = this.mapStatus(tx.status);
      return { status, providerRef: String(tx.id || providerRef), confirmations: status === PaymentStatus.COMPLETED ? 1 : 0 };
    } catch {
      return { status: PaymentStatus.PROCESSING };
    }
  }

  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean {
    if (!this.webhookSecret || !signature) return false;
    const { createHmac, timingSafeEqual } = require("crypto");
    const expected = createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");
    try {
      return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return expected === signature;
    }
  }

  private mapStatus(fedaStatus: string): PaymentStatus {
    switch (fedaStatus) {
      case "approved": case "success": return PaymentStatus.COMPLETED;
      case "declined": case "failed": case "cancelled": return PaymentStatus.FAILED;
      case "refunded": return PaymentStatus.REFUNDED;
      default: return PaymentStatus.PROCESSING;
    }
  }
}

class MTNMoMoProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.MTN_MOMO;
  private readonly logger = new Logger(MTNMoMoProvider.name);
  private readonly http: HttpService;
  private readonly apiUser: string;
  private readonly apiKey: string;
  private readonly subscriptionKey: string;
  private readonly baseUrl: string;
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(http: HttpService) {
    this.http = http;
    this.apiUser = process.env.MTN_MOMO_API_USER || "";
    this.apiKey = process.env.MTN_MOMO_API_KEY || "";
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY || "";
    const sandbox = process.env.MTN_MOMO_SANDBOX !== "false";
    this.baseUrl = sandbox ? "https://sandbox.momodeveloper.mtn.com" : "https://api.mtn.com";
  }

  get isConfigured(): boolean {
    return !!(this.apiUser && this.apiKey && this.subscriptionKey);
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry - 60000) return this.token;
    const basic = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString("base64");
    const { data } = await firstValueFrom(
      this.http.post(`${this.baseUrl}/collection/token/`, null, {
        headers: {
          Authorization: `Basic ${basic}`,
          "Ocp-Apim-Subscription-Key": this.subscriptionKey,
        },
      }),
    );
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  async initiate(amount: number, currency: string, paymentId: PaymentId, metadata?: Record<string, unknown>): Promise<ProviderInitiateResult> {
    const token = await this.getToken();
    const referenceId = crypto.randomUUID();
    const body = {
      amount: String(amount),
      currency: currency === "XOF" ? "EUR" : currency,
      externalId: paymentId.slice(0, 32),
      payer: { partyIdType: "MSISDN", partyId: (metadata?.phone as string) || "0000000000" },
      payerMessage: `AgriTrace #${paymentId.slice(0, 8)}`,
      payeeNote: "Paiement agricole",
    };

    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/collection/v1_0/requesttopay`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": referenceId,
            "X-Target-Environment": process.env.MTN_MOMO_SANDBOX !== "false" ? "sandbox" : "production",
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
          },
        }),
      );
      return {
        success: true,
        providerRef: referenceId,
        status: PaymentStatus.PROCESSING,
      };
    } catch (err: any) {
      this.logger.error(`MTN MoMo initiate failed: ${err.message}`, err.response?.data);
      throw err;
    }
  }

  async checkStatus(providerRef: string): Promise<ProviderStatusResult> {
    try {
      const token = await this.getToken();
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/collection/v1_0/requesttopay/${providerRef}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": process.env.MTN_MOMO_SANDBOX !== "false" ? "sandbox" : "production",
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
          },
        }),
      );
      const status = data.status === "SUCCESSFUL" ? PaymentStatus.COMPLETED
        : data.status === "FAILED" ? PaymentStatus.FAILED
        : PaymentStatus.PROCESSING;
      return { status, providerRef };
    } catch {
      return { status: PaymentStatus.PROCESSING };
    }
  }

  verifyWebhook(): boolean {
    return true;
  }
}

class OrangeMoneyProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.ORANGE_MONEY;
  private readonly logger = new Logger(OrangeMoneyProvider.name);
  private readonly http: HttpService;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(http: HttpService) {
    this.http = http;
    this.clientId = process.env.ORANGE_CLIENT_ID || "";
    this.clientSecret = process.env.ORANGE_CLIENT_SECRET || "";
    const sandbox = process.env.ORANGE_SANDBOX !== "false";
    this.baseUrl = sandbox ? "https://api.sandbox.orange.com" : "https://api.orange.com";
  }

  get isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry - 60000) return this.token;
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");
    const { data } = await firstValueFrom(
      this.http.post(`${this.baseUrl}/oauth/v2/token`, "grant_type=client_credentials", {
        headers: {
          Authorization: `Basic ${basic}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }),
    );
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.token;
  }

  async initiate(amount: number, currency: string, paymentId: PaymentId, metadata?: Record<string, unknown>): Promise<ProviderInitiateResult> {
    const token = await this.getToken();
    const referenceId = crypto.randomUUID();
    const body = {
      amount: { unit: currency === "XOF" ? "EUR" : currency, value: String(amount) },
      reference: paymentId.slice(0, 32),
      metadata: paymentId.slice(0, 32),
      customer: { reference: (metadata?.phone as string) || "0000000000" },
    };

    try {
      await firstValueFrom(
        this.http.post(`${this.baseUrl}/orange-money/payment/v1/requestToPay`, body, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Reference-Id": referenceId,
            Accept: "application/json",
          },
        }),
      );
      return {
        success: true,
        providerRef: referenceId,
        status: PaymentStatus.PROCESSING,
      };
    } catch (err: any) {
      this.logger.error(`Orange Money initiate failed: ${err.message}`, err.response?.data);
      throw err;
    }
  }

  async checkStatus(providerRef: string): Promise<ProviderStatusResult> {
    try {
      const token = await this.getToken();
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/orange-money/payment/v1/requestToPay/${providerRef}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }),
      );
      const status = data.status === "SUCCESSFUL" || data.status === "completed" ? PaymentStatus.COMPLETED
        : data.status === "FAILED" || data.status === "failed" ? PaymentStatus.FAILED
        : PaymentStatus.PROCESSING;
      return { status, providerRef };
    } catch {
      return { status: PaymentStatus.PROCESSING };
    }
  }

  verifyWebhook(): boolean {
    return true;
  }
}

class CinetPayProvider implements IPaymentProvider {
  readonly id = PaymentProviderId.CINETPAY;
  private readonly logger = new Logger(CinetPayProvider.name);
  private readonly http: HttpService;
  private readonly apiKey: string;
  private readonly siteId: string;
  private readonly baseUrl: string;

  constructor(http: HttpService) {
    this.http = http;
    this.apiKey = process.env.CINETPAY_API_KEY || "";
    this.siteId = process.env.CINETPAY_SITE_ID || "";
    this.baseUrl = "https://api.cinetpay.com/v1";
  }

  get isConfigured(): boolean {
    return !!(this.apiKey && this.siteId);
  }

  async initiate(amount: number, currency: string, paymentId: PaymentId, metadata?: Record<string, unknown>): Promise<ProviderInitiateResult> {
    const transactionId = `ATB-${paymentId.slice(0, 12)}`;
    const body = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
      amount,
      currency: currency === "XOF" ? "XOF" : currency,
      description: `AgriTrace #${paymentId.slice(0, 8)}`,
      notify_url: `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/api/payment/webhook/cinetpay`,
      return_url: `${process.env.WEBAPP_URL || "http://localhost:5174"}/orders`,
      channels: "ALL",
      lang: "fr",
    };

    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/payment`, body),
      );
      if (data?.code !== "201" && data?.code !== "00") {
        throw new Error(`CinetPay error: ${data?.message || JSON.stringify(data)}`);
      }
      return {
        success: true,
        providerRef: transactionId,
        paymentUrl: data?.data?.payment_url || data?.data?.url,
        status: PaymentStatus.PROCESSING,
      };
    } catch (err: any) {
      this.logger.error(`CinetPay initiate failed: ${err.message}`, err.response?.data);
      throw err;
    }
  }

  async checkStatus(providerRef: string): Promise<ProviderStatusResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${this.baseUrl}/payment/check`, {
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: providerRef,
        }),
      );
      const status = data?.data?.status === "00" ? PaymentStatus.COMPLETED
        : data?.data?.status === "01" ? PaymentStatus.FAILED
        : PaymentStatus.PROCESSING;
      return { status, providerRef };
    } catch {
      return { status: PaymentStatus.PROCESSING };
    }
  }

  verifyWebhook(payload: Record<string, unknown>, signature: string): boolean {
    const receivedKey = signature || (payload as any).apikey || (payload as any).cpm_api_key;
    return receivedKey === this.apiKey;
  }
}

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers = new Map<PaymentProviderId, IPaymentProvider>();

  constructor(httpService: HttpService) {
    const fedapay = new FedaPayProvider(httpService);
    const momo = new MTNMoMoProvider(httpService);
    const cinetpay = new CinetPayProvider(httpService);
    const orange = new OrangeMoneyProvider(httpService);
    this.register(new MockMobileMoneyProvider());
    this.register(new MockMoovFloozProvider());
    this.register(fedapay.isConfigured ? fedapay : new MockFedaPayProvider());
    this.register(cinetpay.isConfigured ? cinetpay : new MockCinetPayProvider());
    this.register(momo.isConfigured ? momo : new MockMobileMoneyProvider());
    this.register(orange.isConfigured ? orange : new MockOrangeMoneyProvider());
    this.register(new MockBankTransferProvider());
    this.register(new MockCryptoProvider());
    this.register(new MockUsdcPolygonProvider());
  }

  register(provider: IPaymentProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(providerId: PaymentProviderId): IPaymentProvider {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`No provider registered for: ${providerId}`);
    return provider;
  }

  getAll(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }
}
