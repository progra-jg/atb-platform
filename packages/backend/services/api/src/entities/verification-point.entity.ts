import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("verification_points")
export class VerificationPoint {
  @PrimaryColumn({ length: 20 })
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 100 })
  region: string;

  @Column({ length: 100 })
  ville: string;

  @Column({ length: 200 })
  cooperative: string;

  @Column("float8", { array: true })
  coordinates: number[];

  @Column({ name: "capacity_tonnes", type: "int" })
  capacityTonnes: number;

  @Column("text", { array: true })
  services: string[];

  @Column({ length: 30 })
  contact: string;

  @Column({ name: "inspection_fee_fcfa", type: "int" })
  inspectionFeeFcfa: number;
}
