import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { IdempotencyKey } from "../domain/types";

export interface IdempotencyRecord {
  key: string;
  statusCode: number;
  responseBody: unknown;
  createdAt: Date;
}

const TTL_MS = 86_400_000; // 24 hours

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly cache = new Map<string, IdempotencyRecord>();
  private lastCleanup = Date.now();

  async process<T>(
    key: string,
    consumerId: string,
    ttlMs: number = TTL_MS,
    handler: () => Promise<{ statusCode: number; body: T }>,
  ): Promise<{ statusCode: number; body: T; cached: boolean }> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.createdAt.getTime() < ttlMs) {
      this.logger.log(`Idempotency hit for key=${key}`);
      return { statusCode: cached.statusCode, body: cached.responseBody as T, cached: true };
    }

    const result = await handler();
    this.cache.set(key, {
      key,
      statusCode: result.statusCode,
      responseBody: result.body,
      createdAt: new Date(),
    });

    this.cleanupIfNeeded();
    return { ...result, cached: false };
  }

  hasKey(key: string): boolean {
    return this.cache.has(key);
  }

  getKey(key: string): IdempotencyRecord | undefined {
    return this.cache.get(key);
  }

  setKey(key: string, record: IdempotencyRecord): void {
    this.cache.set(key, record);
  }

  private cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup < 60_000) return;
    this.lastCleanup = now;
    for (const [key, record] of this.cache) {
      if (now - record.createdAt.getTime() >= TTL_MS) {
        this.cache.delete(key);
      }
    }
  }
}
