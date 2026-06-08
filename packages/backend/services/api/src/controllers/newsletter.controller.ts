import { Controller, Post, Body, Req, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Controller("api/newsletter")
export class NewsletterController {
  private subscribers = new Set<string>();
  private rateLimits = new Map<string, RateLimitEntry>();

  private checkRateLimit(ip: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 3) {
        const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
        throw new HttpException(`Trop de tentatives. Réessayez dans ${minutesLeft} min.`, HttpStatus.TOO_MANY_REQUESTS);
      }
      entry.count++;
    } else {
      this.rateLimits.set(ip, { count: 1, resetAt: now + 3600000 });
    }
  }

  @Post("subscribe")
  subscribe(@Body() dto: { email: string; name?: string; honeypot?: string }, @Req() req: Request) {
    if (dto.honeypot) {
      return { success: true, message: "Merci de votre inscription !" };
    }

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    this.checkRateLimit(ip);

    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new HttpException("Email invalide.", HttpStatus.BAD_REQUEST);
    }

    const email = dto.email.toLowerCase().trim();
    if (this.subscribers.has(email)) {
      return { success: true, message: "Vous êtes déjà inscrit !" };
    }

    this.subscribers.add(email);
    console.log(`[Newsletter] Nouvel abonné: ${email}${dto.name ? ` (${dto.name.slice(0, 100)})` : ""}`);

    return { success: true, message: "Merci de votre inscription !" };
  }
}
