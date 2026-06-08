import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { AIDashboardService } from "../services/ai-dashboard.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/ai")
@UseGuards(JwtAuthGuard)
export class AIDashboardController {
  constructor(private readonly aiDashboard: AIDashboardService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.aiDashboard.getDashboard();
  }

  @Get("crop-health/:region/:crop")
  async getCropHealth(@Param("region") region: string, @Param("crop") crop: string) {
    return this.aiDashboard.getCropHealth(region, crop);
  }

  @Get("predictive-alerts")
  async getPredictiveAlerts() {
    return this.aiDashboard.getPredictiveAlerts();
  }
}
