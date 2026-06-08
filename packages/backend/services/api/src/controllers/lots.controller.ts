import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class LotsController {
  constructor(private readonly api: ApiService) {}

  @Get("lots")
  async getLots(@Query() query: { culture?: string; statut?: string; region?: string }) {
    return this.api.getLots(query);
  }

  @Get("lots/:id")
  async getLot(@Param("id") id: string) {
    return this.api.getLot(id);
  }
}
