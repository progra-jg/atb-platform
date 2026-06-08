import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

export type ProductCategory = "semence" | "engrais" | "phyto" | "outillage" | "equipement";

@Entity("marketplace_products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "enum", enum: ["semence", "engrais", "phyto", "outillage", "equipement"] })
  category: ProductCategory;

  @Column("text", { nullable: true })
  description: string;

  @Column("float")
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
