import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("parcelles")
export class Parcelle {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  ownerId: string;

  @Column("jsonb")
  polygone: any;

  @Column("jsonb", { nullable: true })
  centre: any;

  @Column("float")
  superficie: number;

  @Column()
  culture: string;

  @Column({ nullable: true })
  village: string;

  @Column("text", { array: true, nullable: true })
  photos: string[];

  @Column({ default: false })
  isVerified: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
