import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("sample_requests")
export class SampleRequest {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  buyerId: string;

  @Column()
  lotId: string;

  @Column()
  producteurId: string;

  @Column()
  quantiteDemandee: string;

  @Column({ default: "en_attente" })
  statut: string;

  @Column({ nullable: true, type: "text" })
  message: string;

  @Column({ nullable: true })
  adresseLivraison: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;

  @Column({ type: "timestamptz", default: () => "NOW()" })
  updatedAt: Date;
}
