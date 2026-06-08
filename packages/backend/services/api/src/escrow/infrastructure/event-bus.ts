import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EscrowDomainEvent, EscrowDomainEventType, EscrowId } from "../domain/types";
import { OutboxEvent } from "../../entities/payment.entity";

export interface EscrowEventHandler {
  handle(event: EscrowDomainEvent): Promise<void>;
}

@Injectable()
export class EscrowEventBus {
  private readonly logger = new Logger(EscrowEventBus.name);
  private readonly handlers = new Map<EscrowDomainEventType, EscrowEventHandler[]>();

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  subscribe(eventType: EscrowDomainEventType, handler: EscrowEventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  async publish(event: EscrowDomainEvent): Promise<void> {
    await this.outboxRepo.save({
      id: event.eventId,
      aggregateId: event.aggregateId,
      aggregateType: "escrow",
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
      where: { status: "pending", aggregateType: "escrow" },
      take: batchSize,
      order: { createdAt: "ASC" },
    });

    let processed = 0;
    for (const record of pending) {
      try {
        const event: EscrowDomainEvent = {
          eventId: record.id,
          eventType: record.eventType as EscrowDomainEventType,
          aggregateId: record.aggregateId as EscrowId,
          aggregateVersion: 1,
          payload: record.payload,
          traceId: record.traceId || crypto.randomUUID(),
          metadata: (record.metadata as EscrowDomainEvent["metadata"]) || { timestamp: Date.now(), source: "outbox_processor" },
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

  private async dispatch(event: EscrowDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.allSettled(handlers.map(h => h.handle(event).catch(err => {
      this.logger.error(`Handler error for ${event.eventType}: ${err.message}`);
    })));
  }
}
