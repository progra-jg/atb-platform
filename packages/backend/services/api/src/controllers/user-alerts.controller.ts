import { Controller, Get, Post, Delete, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/alerts-v2")
@UseGuards(JwtAuthGuard)
export class UserAlertsController {
  constructor(private readonly api: ApiService) {}

  @Get()
  async getUserAlerts(@Query("userId") userId: string) {
    return this.api.getUserAlerts(userId);
  }

  @Post()
  async createAlert(@Body() body: any) {
    return this.api.createAlert(body);
  }

  @Patch(":id/toggle")
  async toggleAlert(@Param("id") id: string) {
    return this.api.toggleAlert(id);
  }

  @Delete(":id")
  async deleteAlert(@Param("id") id: string) {
    return this.api.deleteAlert(id);
  }

  @Post("check")
  async checkAlerts(@Query("userId") userId: string) {
    return this.api.checkAlerts(userId);
  }
}
