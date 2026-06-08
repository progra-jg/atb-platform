import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("buyer_messages")
export class Message {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  senderId: string;

  @Column()
  receiverId: string;

  @Column({ nullable: true })
  lotId: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
