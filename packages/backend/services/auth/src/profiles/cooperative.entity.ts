import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("cooperatives")
export class Cooperative {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  region: string;

  @Column("simple-array")
  memberIds: string[];

  @Column({ nullable: true })
  presidentName: string;

  @CreateDateColumn()
  createdAt: Date;
}
