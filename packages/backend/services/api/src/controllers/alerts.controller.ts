import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly api: ApiService) {}

  @Get("alerts")
  async getAlerts() {
    return this.api.getAlerts();
  }
}
