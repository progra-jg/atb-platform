import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("parcelles")
export class Parcelle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  @Index()
  ownerId: string;

  @Column("geometry", { spatialFeatureType: "Polygon", srid: 4326 })
  polygone: object;

  @Column("float")
  superficie: number;

  @Column({ length: 50 })
  culture: string;

  @Column({ nullable: true })
  village: string;

  @Column("simple-array", { nullable: true })
  photos: string[];

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
