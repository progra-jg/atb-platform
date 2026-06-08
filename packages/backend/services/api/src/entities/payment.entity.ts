import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { PaymentStatus } from "../payment/domain/types";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() @Index() orderId: string;
  @Column({ nullable: true }) contractId: string;
  @Column() @Index() buyerId: string;
  @Column({ nullable: true }) @Index() producteurId: string;

  @Column("decimal", { precision: 15, scale: 2 }) amount: number;
  @Column({ default: "XOF" }) currency: string;

  @Column() method: string;
  @Column({ nullable: true }) provider: string;
  @Column({ nullable: true }) providerRef: string;
  @Column({ type: "text", nullable: true }) providerData: string;

  @Column({ default: PaymentStatus.PENDING })
  status: string;
  @Column({ nullable: true }) statusMessage: string;

  @Column({ nullable: true }) paidAt: Date;
  @Column({ nullable: true }) webhookReceivedAt: Date;

  @Column({ nullable: true }) paymentUrl: string;
  @Column({ nullable: true }) qrCode: string;

  @Column({ nullable: true }) invoiceNumber: string;
  @Column("text", { nullable: true }) notes: string;

  @Column({ default: false }) verifiedByAdmin: boolean;
  @Column({ nullable: true }) verifiedById: string;

  @Column({ nullable: true }) idempotencyKey: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity("outbox_events")
export class OutboxEvent {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() @Index() aggregateId: string;
  @Column() aggregateType: string;
  @Column() @Index() eventType: string;
  @Column("jsonb") payload: Record<string, unknown>;

  @Column({ default: "pending" })
  status: string;
  @Column({ nullable: true }) traceId: string;
  @Column("jsonb", { nullable: true }) metadata: Record<string, unknown>;

  @CreateDateColumn() createdAt: Date;
  @Column({ nullable: true }) publishedAt: Date;
  @Column({ default: 0 }) retryCount: number;
}
