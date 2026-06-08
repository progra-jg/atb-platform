import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("financing_contracts")
export class FinancingContractEntity {
  @PrimaryColumn("uuid") id: string;
  @Column() producteurId: string;
  @Column() offerId: string;
  @Column("int") amount: number;
  @Column("decimal", { precision: 5, scale: 2 }) interestRate: number;
  @Column("int") totalRepayable: number;
  @Column({ default: "active" }) status: string;
  @Column() collateralType: string;
  @Column({ nullable: true }) collateralRef: string;
  @Column() disbursedAt: Date;
  @Column({ nullable: true }) repaidAt: Date;
  @Column() dueDate: Date;
  @Column("text") schedule: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
