import { Controller, Post, Get, Param, UseGuards } from "@nestjs/common";
import { SatelliteService } from "../services/satellite.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api")
@UseGuards(JwtAuthGuard)
export class ComplianceCheckController {
  constructor(private readonly satellite: SatelliteService) {}

  @Post("compliance/check/:parcelleId")
  async checkParcelle(@Param("parcelleId") parcelleId: string) {
    const result = await this.satellite.checkCompliance(parcelleId);
    if (!result) return { error: "Parcelle introuvable" };
    return result;
  }

  @Post("compliance/check-all")
  async checkAll() {
    return this.satellite.checkAllParcelles();
  }
}
