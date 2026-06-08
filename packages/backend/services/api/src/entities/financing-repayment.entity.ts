import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { FinancingContractEntity } from "./financing-contract.entity";

@Entity("financing_repayments")
export class FinancingRepaymentEntity {
  @PrimaryColumn("uuid") id: string;
  @Column("uuid") contractId: string;
  @ManyToOne(() => FinancingContractEntity)
  @JoinColumn({ name: "contract_id" })
  contract: FinancingContractEntity;
  @Column("int") installmentIndex: number;
  @Column("int") amount: number;
  @Column("int", { default: 0 }) penalty: number;
  @Column("int") totalPaid: number;
  @Column() transactionRef: string;
  @CreateDateColumn() paidAt: Date;
  @CreateDateColumn() createdAt: Date;
}
