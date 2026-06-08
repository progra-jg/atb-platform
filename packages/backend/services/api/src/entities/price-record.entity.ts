import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("price_history")
export class PriceRecord {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  culture: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  prixMoyen: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  prixMin: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  prixMax: number;

  @Column({ type: "date" })
  date: string;

  @Column({ default: "market" })
  source: string;
}
