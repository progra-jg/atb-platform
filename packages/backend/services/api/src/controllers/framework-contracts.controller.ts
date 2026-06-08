import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

@Controller("api/framework-contracts")
@UseGuards(JwtAuthGuard)
export class FrameworkContractsController {
  constructor(private readonly api: ApiService) {}

  @Get()
  async getAll(@Query("buyerId") buyerId?: string, @Query("producteurId") producteurId?: string) {
    return this.api.getFrameworkContracts(buyerId, producteurId);
  }

  @Get("suggest-price")
  async suggestPrice(@Query("culture") culture: string) {
    return this.api.suggestContractPrice(culture);
  }

  @Get("verify/:id")
  async verify(@Param("id") id: string, @Query("sig") signature: string) {
    const valid = this.api.verifyContractSignature(id, signature);
    return {
      success: valid,
      data: {
        contractId: id,
        valid,
        issuedBy: "ATB AgriTrace Bénin",
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return this.api.getFrameworkContractById(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.api.createFrameworkContract(body);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: any) {
    return this.api.updateFrameworkContract(id, body);
  }

  @Post(":id/sign")
  async sign(@Param("id") id: string, @Body() body: { role: "buyer" | "producteur" }) {
    return this.api.signFrameworkContract(id, body.role);
  }

  @Post(":id/negotiate")
  async negotiate(@Param("id") id: string, @Body() body: { role: string; prixKg: number; volumeKg: number; message: string }) {
    return this.api.negotiateFrameworkContract(id, body);
  }

  @Post(":id/renew")
  async renew(@Param("id") id: string) {
    return this.api.renewFrameworkContract(id);
  }

  @Post(":id/delivery/:index/recu")
  async markDeliveryRecu(@Param("id") id: string, @Param("index") index: number) {
    return this.api.markDeliveryReceived(id, Number(index));
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.api.deleteFrameworkContract(id);
  }

  @Post(":id/duplicate")
  async duplicate(@Param("id") id: string) {
    return this.api.duplicateFrameworkContract(id);
  }

  @Get(":id/export-pdf")
  async exportPdf(@Param("id") id: string, @Query("lang") lang: string, @Res() res: Response) {
    const pdf = await this.api.exportFrameworkContractPdf(id, (lang === "en" ? "en" : "fr"));
    if (!pdf) { res.status(404).json({ message: "Contrat non trouvé" }); return; }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="contrat-cadre-atb-${id.slice(0, 8)}.pdf"`);
    res.send(pdf);
  }

  @Post(":id/paiements/:index/regle")
  async markPaiementRegle(@Param("id") id: string, @Param("index") index: number) {
    return this.api.markPaiementRegle(id, Number(index));
  }
}
