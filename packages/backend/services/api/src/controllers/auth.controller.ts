import { Controller, Post, Get, Put, Body, UseGuards, Req, HttpException, HttpStatus } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ApiService } from "../services/api.service";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { Request } from "express";

@Controller("api/auth")
export class AuthController {
  constructor(
    private readonly api: ApiService,
    private readonly jwt: JwtService,
  ) {}

  @Post("register")
  async register(@Body() dto: { company: string; email: string; password: string; country: string }) {
    const user = await this.api.registerBuyer(dto);
    const token = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return {
      token,
      user: { id: user.id, company: user.company, email: user.email, country: user.country, role: user.role },
    };
  }

  @Post("login")
  async login(@Body() dto: { email: string; password: string }) {
    const user = await this.api.validateBuyer(dto.email, dto.password);
    if (!user) return { error: "Email ou mot de passe incorrect" };
    const token = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return {
      token,
      user: { id: user.id, company: user.company, email: user.email, country: user.country, role: user.role },
    };
  }

  @Post("google")
  async googleLogin(@Body() dto: { credential: string }) {
    if (!dto.credential) return { error: "Token Google manquant" };
    let email = "";
    let name = "";
    try {
      const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${dto.credential}` },
      });
      if (!resp.ok) throw new Error("Google token invalide");
      const data = await resp.json();
      email = data.email;
      name = data.name || data.given_name || email.split("@")[0];
    } catch {
      try {
        const parts = dto.credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
          email = payload.email || "";
          name = payload.name || payload.given_name || email.split("@")[0];
        }
      } catch {}
      if (!email) return { error: "Impossible de vérifier le token Google" };
    }
    const user = await this.api.findOrCreateGoogleUser(email, name);
    const token = this.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return {
      token,
      user: { id: user.id, company: user.company, email: user.email, country: user.country, role: user.role },
    };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req: Request) {
    const payload = (req as any).user;
    if (!payload) return { error: "Non authentifié" };
    const user = await this.api.getBuyerById(payload.id);
    if (!user) return { error: "Utilisateur introuvable" };
    return {
      id: user.id, company: user.company, email: user.email,
      country: user.country, phone: user.phone, address: user.address,
      role: user.role, metadata: user.metadata,
    };
  }

  @Put("profile")
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req: Request, @Body() dto: any) {
    const payload = (req as any).user;
    if (!payload) return { error: "Non authentifié" };
    const user = await this.api.updateBuyerProfile(payload.id, dto);
    if (!user) return { error: "Utilisateur introuvable" };
    return {
      id: user.id, company: user.company, email: user.email,
      country: user.country, phone: user.phone, address: user.address,
      role: user.role, metadata: user.metadata,
    };
  }

  @Put("password")
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: Request, @Body() dto: { currentPassword: string; newPassword: string }) {
    const payload = (req as any).user;
    if (!payload) return { error: "Non authentifié" };
    const ok = await this.api.changeBuyerPassword(payload.id, dto.currentPassword, dto.newPassword);
    if (!ok) return { error: "Mot de passe actuel incorrect" };
    return { success: true };
  }
}
