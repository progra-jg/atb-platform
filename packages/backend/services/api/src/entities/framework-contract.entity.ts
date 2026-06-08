import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("framework_contracts")
export class FrameworkContract {
  @PrimaryColumn()
  id: string;

  @Column()
  buyerId: string;

  @Column()
  producteurId: string;

  @Column({ nullable: true })
  lotId: string;

  @Column()
  culture: string;

  @Column("decimal", { precision: 12, scale: 2 })
  volumeKg: number;

  @Column("decimal", { precision: 12, scale: 2 })
  prixKg: number;

  @Column({ default: "FCFA" })
  devise: string;

  @Column({ type: "date" })
  dateDebut: string;

  @Column({ type: "date" })
  dateFin: string;

  @Column({ type: "jsonb", nullable: true })
  calendrierLivraisons: { date: string; volume: number; statut: string }[];

  @Column({ type: "jsonb", nullable: true, name: "contre_offres" })
  counterOffers: { role: string; prixKg: number; volumeKg: number; message: string; createdAt: string }[];

  @Column({ type: "jsonb", nullable: true })
  paiements: { echeance: string; montant: number; statut: string; methode?: string; reference?: string; payeAt?: string; livraisonIndex?: number }[];

  @Column({ type: "text", nullable: true })
  conditions: string;

  @Column({ default: "brouillon" })
  statut: string;

  @Column({ nullable: true, type: "timestamptz" })
  signatureBuyerAt: Date;

  @Column({ nullable: true, type: "timestamptz" })
  signatureProducteurAt: Date;

  @Column("decimal", { precision: 16, scale: 2, nullable: true })
  montantTotal: number;

  @Column({ default: false })
  renouvelable: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
