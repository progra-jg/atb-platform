import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly api: ApiService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.api.getDashboardStats();
  }

  @Get("admin/dashboard")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async getAdminDashboard() {
    return this.api.getAdminDashboard();
  }
}
