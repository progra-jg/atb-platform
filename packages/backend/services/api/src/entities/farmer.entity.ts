import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("farmer_profiles")
export class Farmer {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  village: string;

  @Column("jsonb", { nullable: true })
  gpsCoordinates: any;

  @Column("text", { array: true, default: "{fr}" })
  languages: string[];

  @Column({ name: "cooperative_id", nullable: true })
  cooperativeId: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ default: "farmer" })
  role: string;

  @Column({ nullable: true })
  anonymousId: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ nullable: true })
  didHash: string;

  @Column({ default: false })
  didVerified: boolean;

  @Column({ default: 0 })
  experience: number;

  @Column("float", { default: 0 })
  avgRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  displayName: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
