import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("user_favorites")
export class UserFavorite {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn()
  lotId: string;

  @Column({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
}
