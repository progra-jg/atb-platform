import { Controller, Get, Post, Param, Body, Patch, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly api: ApiService) {}

  @Get("orders")
  async getOrders() {
    return this.api.getOrders();
  }

  @Get("orders/:id")
  async getOrder(@Param("id") id: string) {
    return this.api.getOrder(id);
  }

  @Post("orders")
  async createOrder(@Body() dto: any) {
    return this.api.createOrder(dto);
  }

  @Patch("orders/:id/status")
  async updateStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.api.updateOrderStatus(id, status);
  }
}
