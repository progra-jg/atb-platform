import { Controller, Post, Get, Body, Param, Req, HttpException, HttpStatus } from "@nestjs/common";
import { Request } from "express";

interface ContactEntry {
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  ip: string;
  status: "pending" | "answered" | "spam";
  submittedAt: string;
  answeredAt: string | null;
  assignedTo: string | null;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Controller("api/contact")
export class ContactController {
  private submissions = new Map<string, ContactEntry>();
  private rateLimits = new Map<string, RateLimitEntry>();
  private counter = 0;

  private getTicketId(): string {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(2);
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    this.counter = (this.counter % 9999) + 1;
    return `ATB-${yy}${mm}${dd}-${this.counter.toString().padStart(4, "0")}`;
  }

  private checkRateLimit(ip: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(ip);

    if (entry && entry.resetAt > now) {
      if (entry.count >= 5) {
        const minutesLeft = Math.ceil((entry.resetAt - now) / 60000);
        throw new HttpException(
          `Trop de demandes. Réessayez dans ${minutesLeft} min.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      entry.count++;
    } else {
      this.rateLimits.set(ip, { count: 1, resetAt: now + 3600000 });
    }
  }

  @Post()
  submit(@Body() dto: { name: string; email: string; topic: string; message: string; honeypot?: string }, @Req() req: Request) {
    if (dto.honeypot) {
      return { ticketId: "ATB-000000-0000", status: "received", estimatedResponse: "24h" };
    }

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    this.checkRateLimit(ip);

    if (!dto.name || !dto.email || !dto.message) {
      throw new HttpException("Nom, email et message sont requis.", HttpStatus.BAD_REQUEST);
    }

    const ticketId = this.getTicketId();
    const entry: ContactEntry = {
      ticketId,
      name: dto.name.slice(0, 200),
      email: dto.email.toLowerCase().trim().slice(0, 254),
      topic: dto.topic || "general",
      message: dto.message.slice(0, 5000),
      ip,
      status: "pending",
      submittedAt: new Date().toISOString(),
      answeredAt: null,
      assignedTo: null,
    };

    this.submissions.set(ticketId, entry);

    console.log(`[Contact] Nouveau ticket ${ticketId} de ${entry.name} <${entry.email}> — ${entry.topic}`);

    return {
      ticketId,
      status: "received",
      estimatedResponse: "24h",
      submittedAt: entry.submittedAt,
    };
  }

  @Get(":ticketId")
  status(@Param("ticketId") ticketId: string) {
    const entry = this.submissions.get(ticketId);
    if (!entry) {
      throw new HttpException("Ticket introuvable.", HttpStatus.NOT_FOUND);
    }
    return {
      ticketId: entry.ticketId,
      status: entry.status,
      assignedTo: entry.assignedTo,
      submittedAt: entry.submittedAt,
      answeredAt: entry.answeredAt,
    };
  }

  @Get()
  stats() {
    const all = Array.from(this.submissions.values());
    return {
      total: all.length,
      pending: all.filter((e) => e.status === "pending").length,
      answered: all.filter((e) => e.status === "answered").length,
      spam: all.filter((e) => e.status === "spam").length,
    };
  }
}
