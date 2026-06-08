import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParcelleController } from "./parcelle.controller";
import { ParcelleService } from "./parcelle.service";
import { Parcelle } from "./parcelle.entity";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USER || "atb",
      password: process.env.DB_PASS || "atb_dev_2024",
      database: process.env.DB_NAME || "atb_agritrace",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: process.env.NODE_ENV !== "production",
    }),
    TypeOrmModule.forFeature([Parcelle]),
  ],
  controllers: [ParcelleController],
  providers: [ParcelleService],
})
export class ParcelleModule {}
