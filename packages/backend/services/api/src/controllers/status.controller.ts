import { Controller, Get } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom, TimeoutError } from "rxjs";
import { timeout, catchError } from "rxjs/operators";

interface ServiceCheck {
  name: string;
  endpoint: string;
  status: "operational" | "degraded" | "downtime";
  latency: number;
  message: string;
}

interface StatusSnapshot {
  overall: "operational" | "degraded" | "downtime";
  timestamp: string;
  uptime: number;
  services: ServiceCheck[];
}

@Controller("api/status")
export class StatusController {
  private readonly startTime = Date.now();
  private history: { t: number; ok: boolean }[] = [];

  constructor(private readonly http: HttpService) {}

  private async httpCheck(name: string, url: string, threshold = 200): Promise<ServiceCheck> {
    const t0 = performance.now();
    try {
      await firstValueFrom(
        this.http.get(url).pipe(
          timeout(4000),
          catchError((e) => { throw e; })
        )
      );
      const latency = Math.round(performance.now() - t0);
      return {
        name, endpoint: url,
        status: latency > threshold ? "degraded" : "operational",
        latency, message: latency > threshold ? "Latence élevée" : "OK",
      };
    } catch (e: any) {
      return {
        name, endpoint: url,
        status: "downtime",
        latency: Math.round(performance.now() - t0),
        message: e instanceof TimeoutError ? "Timeout" : "Inaccessible",
      };
    }
  }

  @Get("services")
  async checkAll(): Promise<StatusSnapshot> {
    const results = await Promise.all([
      this.inProcessCheck(),
      this.httpCheck("Auth Service", "http://localhost:3002/health"),
      this.httpCheck("Satellite Analysis (U-Net)", "http://localhost:4000/health", 300),
      this.httpCheck("Payment Gateway", "http://localhost:4000/health", 300),
    ]);

    const allOk = results.every((r) => r.status === "operational");
    const anyAlive = results.some((r) => r.status !== "downtime");

    this.history.push({ t: Date.now(), ok: allOk });
    if (this.history.length > 1440) this.history.shift();

    return {
      overall: allOk ? "operational" : anyAlive ? "degraded" : "downtime",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      services: results,
    };
  }

  private inProcessCheck(): ServiceCheck {
    const mem = process.memoryUsage();
    const memMb = Math.round(mem.heapUsed / 1024 / 1024);
    return {
      name: "API Gateway",
      endpoint: "in-process",
      status: memMb < 512 ? "operational" : "degraded",
      latency: 0,
      message: `Heap ${memMb} Mo · Uptime ${Math.floor((Date.now() - this.startTime) / 1000)}s`,
    };
  }

  @Get("history")
  getHistory() {
    return {
      startTime: this.startTime,
      since: new Date(this.startTime).toISOString(),
      points: this.history.slice(-120),
    };
  }
}
