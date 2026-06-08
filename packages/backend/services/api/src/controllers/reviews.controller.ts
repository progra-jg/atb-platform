import { Controller, Get, Post, Param, Body, Patch, BadRequestException, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";

@Controller("api/reviews")
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly api: ApiService) {}

  @Post()
  async create(@Body() dto: { orderId: string; buyerId: string; rating: number; comment?: string }) {
    if (!dto.orderId || !dto.buyerId || !dto.rating) {
      throw new BadRequestException("orderId, buyerId et rating sont requis");
    }
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException("La note doit être entre 1 et 5");
    }
    if (dto.comment && dto.comment.length > 2000) {
      throw new BadRequestException("Le commentaire ne peut pas dépasser 2000 caractères");
    }
    try {
      return await this.api.createReview(dto);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Get("seller/:sellerId")
  async getSellerReviews(@Param("sellerId") sellerId: string) {
    return this.api.getSellerReviews(sellerId);
  }

  @Get("order/:orderId/buyer/:buyerId")
  async getBuyerReview(@Param("orderId") orderId: string, @Param("buyerId") buyerId: string) {
    return this.api.getBuyerReviewForOrder(orderId, buyerId);
  }

  @Get()
  async getAll(@Param() filters?: { sellerId?: string; moderationStatus?: string }) {
    return this.api.getAllReviews(filters);
  }

  @Patch(":id/moderate")
  @UseGuards(RolesGuard)
  @Roles("admin")
  async moderate(@Param("id") id: string, @Body("status") status: string) {
    if (!["approved", "rejected", "pending"].includes(status)) {
      throw new BadRequestException("Statut invalide. Utilisez: approved, rejected, pending");
    }
    return this.api.moderateReview(id, status);
  }
}
