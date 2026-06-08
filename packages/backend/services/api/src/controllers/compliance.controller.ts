import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly api: ApiService) {}

  @Get("compliance")
  async getCompliance() {
    return this.api.getCompliance();
  }
}
