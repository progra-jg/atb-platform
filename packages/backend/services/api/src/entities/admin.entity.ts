import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("admin_users")
export class AdminUser {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  fullName: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ default: "admin" })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
