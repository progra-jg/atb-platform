import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("eudr_compliance")
export class EudrCompliance {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ nullable: true })
  parcelleId: string;

  @Column({ nullable: true })
  lotId: string;

  @Column({ default: false })
  compliant: boolean;

  @Column({ default: false })
  deforestationDetected: boolean;

  @Column({ nullable: true, type: "date" })
  lastAnalysis: string;

  @Column({ nullable: true })
  satelliteSource: string;

  @Column("float", { nullable: true })
  ndviScore: number;

  @Column({ nullable: true, type: "text" })
  details: string;

  @Column({ default: false })
  alertGenerated: boolean;

  @Column()
  createdAt: Date;
}
