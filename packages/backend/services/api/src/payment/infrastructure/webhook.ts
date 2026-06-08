import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentProviderId, TraceId } from "../domain/types";

export interface WebhookPayload {
  raw: Record<string, unknown>;
  signature: string;
  timestamp?: string;
  nonce?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  paymentId?: string;
  eventType?: string;
  reason?: string;
}

export interface IWebhookStrategy {
  readonly provider: PaymentProviderId;
  verify(payload: WebhookPayload): WebhookVerificationResult;
}

class FedaPayWebhookStrategy implements IWebhookStrategy {
  readonly provider = PaymentProviderId.FEDAPAY;
  private readonly secret = process.env.FEDAPAY_WEBHOOK_SECRET || "fedapay_webhook_secret_dev";

  verify(payload: WebhookPayload): WebhookVerificationResult {
    const expectedSig = createHmac("sha256", this.secret)
      .update(JSON.stringify(payload.raw))
      .digest("hex");

    const receivedSig = payload.signature || (payload.raw as any).signature || "";

    try {
      const valid = timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig));
      if (!valid) return { valid: false, reason: "HMAC signature mismatch" };
    } catch {
      return { valid: false, reason: "Invalid signature format" };
    }

    return {
      valid: true,
      paymentId: (payload.raw as any).payment_id || (payload.raw as any).data?.payment?.id,
      eventType: (payload.raw as any).event_type || (payload.raw as any).type,
    };
  }
}

class CinetPayWebhookStrategy implements IWebhookStrategy {
  readonly provider = PaymentProviderId.CINETPAY;
  private readonly apiKey = process.env.CINETPAY_API_KEY || "cinetpay_api_key_dev";

  verify(payload: WebhookPayload): WebhookVerificationResult {
    const receivedKey = payload.signature || (payload.raw as any).apikey || (payload.raw as any).cpm_api_key;
    if (receivedKey !== this.apiKey) {
      return { valid: false, reason: "API key mismatch" };
    }
    return {
      valid: true,
      paymentId: (payload.raw as any).cpm_trans_id || (payload.raw as any).transaction_id,
      eventType: (payload.raw as any).status || "payment.completed",
    };
  }
}

class NoopWebhookStrategy implements IWebhookStrategy {
  readonly provider = null as any;
  verify(_payload: WebhookPayload): WebhookVerificationResult {
    return { valid: true, reason: "No webhook verification for this provider" };
  }
}

@Injectable()
export class WebhookVerifierService {
  private readonly logger = new Logger(WebhookVerifierService.name);
  private readonly strategies = new Map<string, IWebhookStrategy>();

  constructor() {
    this.register(new FedaPayWebhookStrategy());
    this.register(new CinetPayWebhookStrategy());
  }

  register(strategy: IWebhookStrategy): void {
    this.strategies.set(strategy.provider, strategy);
  }

  verify(provider: string, payload: WebhookPayload): WebhookVerificationResult {
    const strategy = this.strategies.get(provider) || new NoopWebhookStrategy();
    const result = strategy.verify(payload);

    if (!result.valid) {
      this.logger.warn(`Webhook verification FAILED for ${provider}: ${result.reason}`);
    }

    return result;
  }

  checkReplay(payload: WebhookPayload, toleranceMs = 300_000): boolean {
    if (!payload.timestamp) return true;
    const now = Date.now();
    const ts = parseInt(payload.timestamp, 10);
    return !isNaN(ts) && Math.abs(now - ts) <= toleranceMs;
  }
}
