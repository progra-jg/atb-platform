import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("financing_offers")
export class FinancingOfferEntity {
  @PrimaryColumn() id: string;
  @Column() inputType: string;
  @Column() label: string;
  @Column("int") maxAmount: number;
  @Column("decimal", { precision: 5, scale: 2 }) interestRate: number;
  @Column("int") durationDays: number;
  @Column("int") minTrustScore: number;
  @Column("text") collateralRequired: string;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
