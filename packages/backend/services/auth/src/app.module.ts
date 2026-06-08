import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { AuthModule } from "./auth.module";

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
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
    }),
    AuthModule,
  ],
})
export class AppModule {}
