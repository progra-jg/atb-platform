import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm";

@Entity("price_predictions")
export class PricePrediction {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() crop: string;
  @Column() @Index() region: string;
  @Column() predictedDate: Date;
  @Column("decimal", { precision: 15, scale: 2 }) predictedPrice: number;
  @Column("decimal", { precision: 15, scale: 2 }) confidenceLower: number;
  @Column("decimal", { precision: 15, scale: 2 }) confidenceUpper: number;
  @Column({ default: "ensemble" }) modelType: string;
  @Column("decimal", { precision: 15, scale: 2, nullable: true }) actualPrice: number;
  @Column({ nullable: true }) validatedAt: Date;
  @Column("decimal", { precision: 5, scale: 2, nullable: true }) error: number;
  @CreateDateColumn() createdAt: Date;
}

@Entity("prediction_accuracy")
export class PredictionAccuracy {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() crop: string;
  @Column() @Index() region: string;
  @Column() modelType: string;
  @Column("decimal", { precision: 5, scale: 2 }) mae: number;
  @Column("decimal", { precision: 5, scale: 2 }) rmse: number;
  @Column("decimal", { precision: 5, scale: 2 }) mape: number;
  @Column("int") sampleSize: number;
  @Column({ nullable: true }) lastTestedAt: Date;
  @CreateDateColumn() createdAt: Date;
}
