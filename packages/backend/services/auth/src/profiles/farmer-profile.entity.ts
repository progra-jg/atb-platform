import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("farmer_profiles")
export class FarmerProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, unique: true })
  phone: string;

  @Column({ nullable: true })
  village: string;

  @Column("jsonb", { nullable: true })
  gpsCoordinates: { lat: number; lng: number };

  @Column("simple-array", { default: ["fr"] })
  languages: string[];

  @Column({ nullable: true })
  cooperativeId: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ default: "farmer" })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
