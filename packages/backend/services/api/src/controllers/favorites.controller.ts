import { Controller, Get, Post, Delete, Param, Query, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/favorites")
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly api: ApiService) {}

  @Get()
  async getFavorites(@Query("userId") userId: string) {
    return this.api.getFavorites(userId);
  }

  @Post(":lotId")
  async addFavorite(@Query("userId") userId: string, @Param("lotId") lotId: string) {
    return this.api.addFavorite(userId, lotId);
  }

  @Delete(":lotId")
  async removeFavorite(@Query("userId") userId: string, @Param("lotId") lotId: string) {
    return this.api.removeFavorite(userId, lotId);
  }

  @Get("updates")
  async getFavoriteUpdates(@Query("userId") userId: string) {
    return this.api.getFavoriteUpdates(userId);
  }
}
