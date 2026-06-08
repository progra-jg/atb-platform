import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("audit_log")
export class AuditLog {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column("jsonb", { nullable: true })
  details: any;

  @Column({ nullable: true })
  ipAddress: string;

  @Column()
  createdAt: Date;
}
