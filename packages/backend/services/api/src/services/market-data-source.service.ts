import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Lot } from "../entities/lot.entity";

interface CommodityEntry {
  crop: string;
  price: number;
  change: number;
  unit: string;
  lastUpdated: string;
}

@Injectable()
export class MarketDataSourceService implements OnModuleInit {
  private apiKey: string = "";
  private cache: { data: CommodityEntry[]; timestamp: number } | null = null;
  private readonly CACHE_TTL = 3600_000;
  private readonly MANSA_URL = "https://mansaapi.com/api/v1/markets/commodities";

  constructor(
    private readonly http: HttpService,
    @InjectRepository(Lot) private readonly lotRepo: Repository<Lot>,
  ) {
    this.apiKey = process.env.MANSA_API_KEY || "";
  }

  async onModuleInit() {
    if (!this.apiKey) {
      try {
        const res = await firstValueFrom(
          this.http.post("https://mansaapi.com/api/v1/keys", {
            name: "ATB AgriTrace",
            email: process.env.MANSA_EMAIL || "api@atb.bj",
          }, { headers: { "Content-Type": "application/json" } }),
        );
        this.apiKey = res.data?.key || "";
        if (this.apiKey) console.log("[MarketDataSource] Mansa API key obtained");
      } catch (e: any) {
        console.log("[MarketDataSource] No Mansa API key, will use DB fallback");
      }
    }
  }

  async fetch(): Promise<CommodityEntry[]> {
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.data;
    }

    if (!this.apiKey) return this.fallbackFromDb();

    try {
      const res = await firstValueFrom(
        this.http.get(this.MANSA_URL, {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 8000,
        }),
      );
      const raw = res.data?.data || res.data || [];
      const mapped: CommodityEntry[] = raw.map((item: any) => ({
        crop: item.name || item.crop || item.symbol || "Unknown",
        price: item.price || item.close || item.currentPrice || 0,
        change: item.changePercentage ?? item.change ?? 0,
        unit: item.unit || "FCFA/kg",
        lastUpdated: item.lastUpdated || item.currentDateTime || new Date().toISOString(),
      }));
      this.cache = { data: mapped, timestamp: Date.now() };
      return mapped;
    } catch {
      return this.fallbackFromDb();
    }
  }

  private async fallbackFromDb(): Promise<CommodityEntry[]> {
    try {
      const lots = await this.lotRepo.find({ order: { date: "DESC" } });
      const grouped: Record<string, number[]> = {};
      for (const lot of lots) {
        if (!grouped[lot.culture]) grouped[lot.culture] = [];
        grouped[lot.culture].push(lot.prix);
      }
      return Object.entries(grouped).map(([crop, prices]) => ({
        crop,
        price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        change: 0,
        unit: "FCFA/kg",
        lastUpdated: new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  clearCache() {
    this.cache = null;
  }
}
