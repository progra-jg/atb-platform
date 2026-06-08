import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("user_alerts")
export class UserAlert {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  crop: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  certification: string;

  @Column({ nullable: true })
  direction: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  targetPrice: number;

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  triggered: boolean;

  @Column({ nullable: true, type: "timestamptz" })
  triggeredAt: Date;

  @Column({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
}
