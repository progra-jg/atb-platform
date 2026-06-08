import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("transactions")
export class Transaction {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ nullable: true })
  lotId: string;

  @Column({ nullable: true })
  producteurId: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  montant: string;

  @Column({ nullable: true })
  statut: string;

  @Column({ nullable: true })
  blockchainHash: string;

  @Column({ nullable: true })
  blockchainBlock: string;

  @Column({ nullable: true })
  blockchainTimestamp: Date;

  @Column({ default: false })
  onChain: boolean;

  @Column()
  createdAt: Date;
}
