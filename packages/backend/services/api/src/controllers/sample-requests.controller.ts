import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/sample-requests")
@UseGuards(JwtAuthGuard)
export class SampleRequestsController {
  constructor(private readonly api: ApiService) {}

  @Get()
  async getSampleRequests(@Query("buyerId") buyerId: string) {
    return this.api.getSampleRequests(buyerId);
  }

  @Post()
  async createRequest(@Body() body: any) {
    return this.api.createSampleRequest(body);
  }

  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body("statut") statut: string) {
    return this.api.updateSampleRequestStatus(id, statut);
  }
}
