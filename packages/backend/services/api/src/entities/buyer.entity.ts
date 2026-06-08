import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("buyer_profiles")
export class Buyer {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  company: string;

  @Column()
  email: string;

  @Column()
  country: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column("jsonb", { nullable: true })
  metadata: any;

  @Column("text", { array: true, nullable: true })
  accreditations: string[];

  @Column({ nullable: true })
  walletAddress: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ default: "buyer" })
  role: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
