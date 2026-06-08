import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("weather_forecasts")
export class WeatherForecast {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() region: string;
  @Column("double precision") latitude: number;
  @Column("double precision") longitude: number;
  @Column("date") forecastDate: string;
  @Column("double precision") tempMin: number;
  @Column("double precision") tempMax: number;
  @Column("double precision") precipitation: number;
  @Column("double precision") humidity: number;
  @Column("double precision") windSpeed: number;
  @Column("double precision") solarRadiation: number;
  @Column({ nullable: true }) weatherCode: number;
  @Column({ nullable: true }) weatherLabel: string;
  @CreateDateColumn() createdAt: Date;
}

@Entity("weather_history")
@Index(["region", "date"])
export class WeatherHistory {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() region: string;
  @Column("date") date: string;
  @Column("double precision") tempMin: number;
  @Column("double precision") tempMax: number;
  @Column("double precision") precipitation: number;
  @Column("double precision") humidity: number;
  @Column("double precision") windSpeed: number;
  @Column("double precision") solarRadiation: number;
  @CreateDateColumn() createdAt: Date;
}

@Entity("weather_alerts")
export class WeatherAlert {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() region: string;
  @Column() type: string;
  @Column() severity: string;
  @Column("text") title: string;
  @Column("text") description: string;
  @Column("date") startDate: string;
  @Column("date") endDate: string;
  @Column({ default: false }) active: boolean;
  @Column({ nullable: true }) crop: string;
  @CreateDateColumn() createdAt: Date;
}

@Entity("disease_risks")
@Index(["region", "crop", "date"])
export class DiseaseRisk {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() @Index() region: string;
  @Column() @Index() crop: string;
  @Column("date") date: string;
  @Column() diseaseName: string;
  @Column() riskLevel: string;
  @Column("double precision") riskScore: number;
  @Column("text") description: string;
  @Column("text") preventiveMeasures: string;
  @Column("text") treatment: string;
  @Column({ default: false }) activeAlert: boolean;
  @CreateDateColumn() createdAt: Date;
}

@Entity("disease_reports")
export class DiseaseReport {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ nullable: true }) farmerId: string;
  @Column() region: string;
  @Column() crop: string;
  @Column() diseaseName: string;
  @Column("double precision") estimatedArea: number;
  @Column({ nullable: true }) severity: string;
  @Column({ nullable: true }) status: string;
  @Column("text", { nullable: true }) imageUrl: string;
  @Column("text") description: string;
  @Column("jsonb", { nullable: true }) coordinates: any;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
