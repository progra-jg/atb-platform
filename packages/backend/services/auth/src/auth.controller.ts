import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Patch,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./strategies/jwt.strategy";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  ForgotPasswordDto,
  AdminLoginDto,
  TotpChallengeDto,
  TotpSetupDto,
  TotpVerifyDto,
  TotpDisableDto,
} from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string, expiresIn: number) {
    const isSecure = process.env.NODE_ENV === "production";
    res.cookie("atb_access_token", accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("atb_refresh_token", refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn * 1000,
    });
  }

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    return result;
  }

  @UseGuards(RateLimitGuard)
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    if ("totpRequired" in result) {
      return { totpRequired: true, loginToken: (result as any).loginToken };
    }
    const r = result as { accessToken: string; refreshToken: string; expiresIn: number };
    this.setTokenCookies(res, r.accessToken, r.refreshToken, r.expiresIn);
    return result;
  }

  @Post("refresh")
  async refresh(@Body() dto: RefreshDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.refresh(dto.refreshToken);
    this.setTokenCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    return result;
  }

  @UseGuards(RateLimitGuard)
  @Post("admin/login")
  async adminLogin(@Body() dto: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.adminLogin(dto);
    this.setTokenCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    return result;
  }

  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  async updateProfile(@Req() req, @Body() body: any) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @UseGuards(RateLimitGuard)
  @Post("2fa/challenge")
  async totpChallenge(@Body() dto: TotpChallengeDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.verifyTotpChallenge(dto.loginToken, dto.code);
    this.setTokenCookies(res, result.accessToken, result.refreshToken, result.expiresIn);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get("2fa/status")
  async getTotpStatus(@Req() req) {
    return this.authService.getTotpStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/generate")
  async generateTotp(@Req() req, @Body() dto: TotpSetupDto) {
    return this.authService.generateTotpSecret(req.user.id, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/enable")
  async enableTotp(@Req() req, @Body() dto: TotpVerifyDto) {
    return this.authService.enableTotp(req.user.id, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post("2fa/disable")
  async disableTotp(@Req() req, @Body() dto: TotpDisableDto) {
    return this.authService.disableTotp(req.user.id, dto.password);
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    const isSecure = process.env.NODE_ENV === "production";
    res.clearCookie("atb_access_token", { path: "/", secure: isSecure, sameSite: "lax" });
    res.clearCookie("atb_refresh_token", { path: "/", secure: isSecure, sameSite: "lax" });
    return { message: "Déconnecté" };
  }
}
