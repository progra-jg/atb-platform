import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("marketplace_orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  producteurId: string;

  @Column({ nullable: true })
  buyerId: string;

  @Column("jsonb")
  items: any;

  @Column("float")
  total: number;

  @Column({ default: "pending" })
  status: string;

  @Column({ nullable: true })
  deliveryGps: string;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column("jsonb", { nullable: true })
  adresseLivraison: any;

  @Column({ nullable: true })
  contactPhone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
