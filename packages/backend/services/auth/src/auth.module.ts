import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { SeedService } from "./seed/seed.service";
import { FarmerProfile } from "./profiles/farmer-profile.entity";
import { BuyerProfile } from "./profiles/buyer-profile.entity";
import { Cooperative } from "./profiles/cooperative.entity";
import { AdminProfile } from "./profiles/admin-profile.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([FarmerProfile, BuyerProfile, Cooperative, AdminProfile]),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "atb_jwt_secret_dev",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SeedService],
  exports: [AuthService],
})
export class AuthModule {}
