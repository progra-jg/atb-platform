import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("seller_reviews")
export class Review {
  @PrimaryColumn("uuid")
  id: string;

  @Column()
  orderId: string;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  @Column("int")
  rating: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ default: "pending" })
  moderationStatus: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
