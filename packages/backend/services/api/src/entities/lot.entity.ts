import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("lots")
export class Lot {
  @PrimaryColumn()
  id: string;

  @Column()
  culture: string;

  @Column({ nullable: true })
  origine: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  quantite: string;

  @Column({ nullable: true })
  certification: string;

  @Column({ default: "Disponible" })
  statut: string;

  @Column("float")
  prix: number;

  @Column({ nullable: true })
  producteurId: string;

  @Column({ nullable: true })
  cooperative: string;

  @Column({ default: 0 })
  note: number;

  @Column({ nullable: true, type: "date" })
  date: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  parcelleId: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
