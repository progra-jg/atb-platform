import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OutboxEvent } from "../../entities/payment.entity";
import { PayoutDomainEvent, PayoutDomainEventType } from "../domain/types";

@Injectable()
export class PayoutEventBus {
  private readonly logger = new Logger(PayoutEventBus.name);

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
  ) {}

  async publish(event: PayoutDomainEvent): Promise<void> {
    try {
      await this.outboxRepo.save({
        aggregateId: event.aggregateId,
        aggregateType: "payout",
        eventType: event.eventType,
        payload: event.payload as Record<string, unknown>,
        status: "pending",
        traceId: event.traceId,
        metadata: event.metadata as Record<string, unknown>,
        retryCount: 0,
      });
    } catch (err) {
      this.logger.error(`Failed to publish payout event: ${err.message}`);
    }
  }
}
