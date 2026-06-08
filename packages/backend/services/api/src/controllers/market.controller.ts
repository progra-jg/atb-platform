import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class MarketController {
  constructor(private readonly api: ApiService) {}

  @Get("market/prices")
  async getPrices() {
    return this.api.getMarketPrices();
  }

  @Get("products")
  async getProducts() {
    return this.api.getProducts();
  }

  @Get("stats")
  async getStats() {
    return this.api.getBuyerStats();
  }

  @Get("parcelles")
  async getParcelles() {
    return this.api.getParcelles();
  }

  @Get("audit-logs")
  async getAuditLogs() {
    return this.api.getAuditLogs();
  }

  @Get("cooperatives")
  async getCooperatives() {
    return this.api.getCooperatives();
  }
}
