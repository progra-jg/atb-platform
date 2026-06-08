import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly api: ApiService) {}

  @Get("certificates")
  async getCertificates() {
    return this.api.getCertificates();
  }
}
