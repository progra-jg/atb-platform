import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentDomainEvent, PaymentDomainEventType, PaymentId, TraceId } from "../domain/types";
import { OutboxEvent } from "../../entities/payment.entity";

export interface EventHandler {
  handle(event: PaymentDomainEvent): Promise<void>;
}

@Injectable()
export class PaymentEventBus {
  private readonly logger = new Logger(PaymentEventBus.name);
  private readonly handlers = new Map<PaymentDomainEventType, EventHandler[]>();

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  subscribe(eventType: PaymentDomainEventType, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async publish(event: PaymentDomainEvent): Promise<void> {
    await this.outboxRepo.save({
      id: event.eventId,
      aggregateId: event.aggregateId,
      aggregateType: "payment",
      eventType: event.eventType,
      payload: event.payload as Record<string, unknown>,
      status: "pending",
      traceId: event.traceId,
      metadata: event.metadata,
      createdAt: new Date(),
      retryCount: 0,
    });

    await this.dispatch(event);
  }

  async processOutbox(batchSize = 50): Promise<number> {
    const pending = await this.outboxRepo.find({
      where: { status: "pending" },
      take: batchSize,
      order: { createdAt: "ASC" },
    });

    let processed = 0;
    for (const record of pending) {
      try {
        const event: PaymentDomainEvent = {
          eventId: record.id,
          eventType: record.eventType as PaymentDomainEventType,
          aggregateId: record.aggregateId as PaymentId,
          aggregateVersion: 1,
          payload: record.payload,
          traceId: (record.traceId || crypto.randomUUID()) as TraceId,
          metadata: (record.metadata as PaymentDomainEvent["metadata"]) || { timestamp: Date.now(), source: "outbox_processor" },
        };
        await this.dispatch(event);
        await this.outboxRepo.update(record.id, { status: "published", publishedAt: new Date() });
        processed++;
      } catch (err) {
        this.logger.error(`Failed to process outbox event ${record.id}: ${err.message}`);
        await this.outboxRepo.update(record.id, {
          status: "failed",
          payload: { ...record.payload, _error: err.message },
        });
      }
    }
    return processed;
  }

  private async dispatch(event: PaymentDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.allSettled(handlers.map(h => h.handle(event).catch(err => {
      this.logger.error(`Handler error for ${event.eventType}: ${err.message}`);
    })));
  }
}
