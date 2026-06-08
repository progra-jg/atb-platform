import { Controller, Get, Post, Param, Body, UseGuards } from "@nestjs/common";
import { DiseaseService } from "../services/disease.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/disease")
@UseGuards(JwtAuthGuard)
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Get("risks/:region/:crop")
  async getRisks(@Param("region") region: string, @Param("crop") crop: string) {
    return this.diseaseService.getRisks(region, crop);
  }

  @Get("risks/:region")
  async getRegionalRisks(@Param("region") region: string) {
    return this.diseaseService.getRegionalRisks(region);
  }

  @Get("crop/:crop")
  async getCropRisks(@Param("crop") crop: string) {
    return this.diseaseService.getCropRisks(crop);
  }

  @Get("summary")
  async getRiskSummary() {
    return this.diseaseService.getRiskSummary();
  }

  @Get("reports/:region")
  async getReportsByRegion(@Param("region") region: string) {
    return this.diseaseService.getReports(region);
  }

  @Get("reports")
  async getAllReports() {
    return this.diseaseService.getReports();
  }

  @Post("report")
  async reportDisease(@Body() body: {
    farmerId?: string; region: string; crop: string; diseaseName: string;
    estimatedArea: number; severity?: string; imageUrl?: string; description: string;
    coordinates?: any;
  }) {
    return this.diseaseService.reportDisease(body);
  }
}
