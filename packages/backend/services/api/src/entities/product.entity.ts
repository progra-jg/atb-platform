import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("marketplace_products")
export class Product {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ nullable: true, type: "text" })
  description: string;

  @Column("float")
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
