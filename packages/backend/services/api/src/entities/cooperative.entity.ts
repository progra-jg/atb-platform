import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("cooperatives")
export class Cooperative {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  region: string;

  @Column("text", { array: true, default: "{}" })
  memberIds: string[];

  @Column({ nullable: true })
  presidentName: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column()
  createdAt: Date;
}
