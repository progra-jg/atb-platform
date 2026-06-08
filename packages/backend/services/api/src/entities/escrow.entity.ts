import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { EscrowStatus } from "../escrow/domain/types";

@Entity("escrows")
export class Escrow {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() orderId: string;
  @Column({ nullable: true }) contractId: string;
  @Column() @Index() buyerId: string;
  @Column() @Index() producteurId: string;
  @Column("decimal", { precision: 18, scale: 6 }) amount: number;
  @Column({ default: "USDT" }) currency: string;
  @Column({ default: "TRC-20" }) network: string;
  @Column({ default: EscrowStatus.PENDING }) status: string;
  @Column({ nullable: true }) contractAddress: string;
  @Column({ nullable: true }) depositTxHash: string;
  @Column({ nullable: true }) releaseTxHash: string;
  @Column({ nullable: true }) refundTxHash: string;
  @Column({ nullable: true }) fundedAt: Date;
  @Column({ nullable: true }) deliveredAt: Date;
  @Column({ nullable: true }) confirmedAt: Date;
  @Column({ nullable: true }) releasedAt: Date;
  @Column("text", { nullable: true }) terms: string;
  @Column("decimal", { precision: 5, scale: 2, default: 0.5 }) feePercentage: number;
  @Column({ nullable: true }) buyerSignature: string;
  @Column({ nullable: true }) producteurSignature: string;
  @Column({ default: false }) disputed: boolean;
  @Column({ nullable: true }) disputedAt: Date;
  @Column({ nullable: true }) disputeReason: string;
  @Column({ nullable: true }) resolvedById: string;
  @Column({ nullable: true }) resolvedAt: Date;
  @Column({ nullable: true }) resolution: string;
  @Column({ default: false }) archived: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
