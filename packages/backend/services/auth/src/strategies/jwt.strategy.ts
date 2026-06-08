import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "atb_jwt_secret_dev",
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, role: payload.role };
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
