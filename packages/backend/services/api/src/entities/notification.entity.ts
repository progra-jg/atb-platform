import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("notifications")
export class Notification {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column()
  userType: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  createdAt: Date;
}
