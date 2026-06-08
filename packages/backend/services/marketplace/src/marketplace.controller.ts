import { Controller, Get, Post, Patch, Param, Body, Query } from "@nestjs/common";
import { MarketplaceService } from "./marketplace.service";
import { ProductCategory } from "./product.entity";

@Controller("marketplace")
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get("products")
  async getProducts(@Query("category") category?: ProductCategory) {
    return this.service.getProducts(category);
  }

  @Get("products/:id")
  async getProduct(@Param("id") id: string) {
    return this.service.getProduct(id);
  }

  @Post("products")
  async createProduct(@Body() dto: any) {
    return this.service.createProduct(dto);
  }

  @Post("orders")
  async createOrder(@Body() dto: any) {
    return this.service.createOrder(dto);
  }

  @Get("orders/:id")
  async getOrder(@Param("id") id: string) {
    return this.service.getOrder(id);
  }

  @Get("orders/producteur/:producteurId")
  async getProducteurOrders(@Param("producteurId") producteurId: string) {
    return this.service.getProducteurOrders(producteurId);
  }

  @Patch("orders/:id/status")
  async updateOrderStatus(@Param("id") id: string, @Body() dto: { status: string }) {
    return this.service.updateOrderStatus(id, dto.status);
  }
}
