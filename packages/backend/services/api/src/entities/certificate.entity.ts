import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("certificates")
export class Certificate {
  @PrimaryColumn()
  id: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  lotId: string;

  @Column({ nullable: true })
  culture: string;

  @Column({ default: "Valide" })
  statut: string;

  @Column({ nullable: true, type: "date" })
  emis: string;

  @Column({ nullable: true, type: "date" })
  expire: string;

  @Column({ nullable: true })
  emetteur: string;

  @Column({ nullable: true })
  format: string;

  @Column({ default: false })
  blockchain: boolean;

  @Column({ nullable: true })
  blockchainTxHash: string;

  @Column({ nullable: true })
  metadataUri: string;

  @Column()
  createdAt: Date;
}
