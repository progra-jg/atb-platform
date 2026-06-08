import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("buyer_profiles")
export class BuyerProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 150 })
  company: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 50 })
  country: string;

  @Column("simple-array", { nullable: true })
  accreditations: string[];

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ default: "buyer" })
  role: string;

  @Column({ nullable: true, select: false })
  totpSecret: string;

  @Column({ default: false })
  totpEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
