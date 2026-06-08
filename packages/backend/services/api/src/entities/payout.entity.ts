import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { PayoutStatus } from "../payout/domain/types";

@Entity("payouts")
export class Payout {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column() @Index() paymentId: string;
  @Column() @Index() orderId: string;
  @Column() @Index() producteurId: string;

  @Column("decimal", { precision: 15, scale: 2 }) amount: number;
  @Column({ default: "XOF" }) currency: string;

  @Column() method: string;
  @Column({ nullable: true }) provider: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) providerRef: string;
  @Column({ type: "text", nullable: true }) providerData: string;

  @Column({ default: PayoutStatus.PENDING }) status: string;
  @Column({ nullable: true }) statusMessage: string;

  @Column({ nullable: true }) completedAt: Date;
  @Column({ nullable: true }) failedAt: Date;
  @Column({ type: "text", nullable: true }) failureReason: string;

  @Column({ default: 0 }) retryCount: number;
  @Column({ nullable: true }) lastRetryAt: Date;

  @Column({ nullable: true }) idempotencyKey: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
