import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";

export type OrderStatus = "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled";

@Entity("marketplace_orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  producteurId: string;

  @Column("simple-json")
  items: OrderItem[];

  @Column("float")
  total: number;

  @Column({ type: "enum", enum: ["pending", "confirmed", "paid", "shipped", "delivered", "cancelled"], default: "pending" })
  status: OrderStatus;

  @Column({ nullable: true })
  deliveryGps: string;

  @Column({ nullable: true })
  paymentReference: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
