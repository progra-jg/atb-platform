import { Injectable } from "@nestjs/common";

export type FinancingEventType = "financing.disbursed" | "financing.repaid" | "financing.repayment" | "financing.overdue" | "financing.defaulted";

export interface FinancingEvent {
  type: FinancingEventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

@Injectable()
export class FinancingEventBus {
  private handlers = new Map<FinancingEventType, Array<(event: FinancingEvent) => void>>();

  on(type: FinancingEventType, handler: (event: FinancingEvent) => void) {
    if (!this.handlers.has(type)) this.handlers.set(type, []);
    this.handlers.get(type)!.push(handler);
  }

  emit(type: FinancingEventType, data: Record<string, unknown>) {
    const event: FinancingEvent = { type, data, timestamp: new Date() };
    const handlers = this.handlers.get(type) || [];
    handlers.forEach((h) => { try { h(event); } catch {} });
  }
}
