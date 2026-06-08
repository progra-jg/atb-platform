import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class MarketIntelligenceController {
  constructor(private readonly api: ApiService) {}

  @Get("market-feed")
  async getMarketFeed() {
    return this.api.getMarketFeed();
  }

  @Get("sustainability/:lotId")
  async getSustainabilityScore(@Param("lotId") lotId: string) {
    return this.api.getSustainabilityScore(lotId);
  }
}
