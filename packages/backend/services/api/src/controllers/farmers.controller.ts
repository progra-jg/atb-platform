import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class FarmersController {
  constructor(private readonly api: ApiService) {}

  @Get("farmers")
  async getFarmers() {
    return this.api.getFarmers();
  }

  @Get("farmers/:id")
  async getFarmer(@Param("id") id: string) {
    return this.api.getFarmer(id);
  }
}
