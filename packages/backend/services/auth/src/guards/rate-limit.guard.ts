import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";

const FAILED_ATTEMPTS = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000;
const WINDOW_DURATION = 60 * 1000;

@Injectable()
export class RateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: Request = context.switchToHttp().getRequest();
    const ip = request.ip || request.socket?.remoteAddress || "unknown";

    const now = Date.now();
    const record = FAILED_ATTEMPTS.get(ip);

    if (record && now - record.lastAttempt < BLOCK_DURATION && record.count >= MAX_ATTEMPTS) {
      throw new HttpException("Identifiants incorrects", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (record && now - record.lastAttempt > WINDOW_DURATION) {
      FAILED_ATTEMPTS.delete(ip);
    }

    request.on("finish", () => {
      const status = (context.switchToHttp().getResponse() as any).statusCode;
      if (status === 401) {
        const current = FAILED_ATTEMPTS.get(ip) || { count: 0, lastAttempt: now };
        current.count += 1;
        current.lastAttempt = now;
        FAILED_ATTEMPTS.set(ip, current);
      } else if (status >= 200 && status < 300) {
        FAILED_ATTEMPTS.delete(ip);
      }
    });

    return true;
  }
}
