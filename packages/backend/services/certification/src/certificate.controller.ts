import { Controller, Post, Get, Param, Body } from "@nestjs/common";
import { CertificateService } from "./certificate.service";

@Controller("certificates")
export class CertificateController {
  constructor(private readonly certService: CertificateService) {}

  @Post("generate")
  async generate(
    @Body() dto: { lotId: string; type: "EUDR" | "GlobalGAP" },
  ) {
    return this.certService.generateCertificate(dto.lotId, dto.type);
  }

  @Get(":id")
  async getCertificate(@Param("id") id: string) {
    return this.certService.verifyCertificate(id);
  }
}
