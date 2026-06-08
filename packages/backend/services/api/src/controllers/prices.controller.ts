import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/prices")
@UseGuards(JwtAuthGuard)
export class PricesController {
  constructor(private readonly api: ApiService) {}

  @Get("history")
  async getPriceHistory(@Query("culture") culture?: string, @Query("months") months?: string) {
    return this.api.getPriceHistory(culture || null, months ? parseInt(months) : 12);
  }
}
