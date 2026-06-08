import { Controller, Get, Put, Param, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly api: ApiService) {}

  @Get("notifications")
  async getNotifications() {
    return this.api.getNotifications();
  }

  @Put("notifications/:id/read")
  async markRead(@Param("id") id: string) {
    return this.api.markNotificationRead(id);
  }

  @Put("notifications/read-all")
  async markAllRead() {
    return this.api.markAllNotificationsRead();
  }
}
