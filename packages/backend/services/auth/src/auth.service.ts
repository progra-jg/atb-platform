import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { FarmerProfile } from "./profiles/farmer-profile.entity";
import { BuyerProfile } from "./profiles/buyer-profile.entity";
import { AdminProfile } from "./profiles/admin-profile.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(FarmerProfile)
    private farmerRepo: Repository<FarmerProfile>,
    @InjectRepository(BuyerProfile)
    private buyerRepo: Repository<BuyerProfile>,
    @InjectRepository(AdminProfile)
    private adminRepo: Repository<AdminProfile>,
    private jwtService: JwtService,
  ) {}

  async register(dto: any) {
    const existing =
      (await this.farmerRepo.findOne({ where: { phone: dto.phone } })) ||
      (await this.buyerRepo.findOne({ where: { email: dto.email } }));
    if (existing) throw new ConflictException("User already exists");

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    let profile: any;
    if (dto.role === "farmer") {
      profile = this.farmerRepo.create({
        name: dto.name,
        phone: dto.phone,
        village: dto.village,
        gpsCoordinates: dto.gpsCoordinates,
        languages: dto.languages || ["fr"],
        cooperativeId: dto.cooperativeId,
        passwordHash: hashedPassword,
      });
      profile = await this.farmerRepo.save(profile);
    } else {
      profile = this.buyerRepo.create({
        company: dto.company,
        email: dto.email,
        country: dto.country,
        accreditations: dto.accreditations,
        walletAddress: dto.walletAddress,
        passwordHash: hashedPassword,
      });
      profile = await this.buyerRepo.save(profile);
    }

    const tokens = this.generateTokens(profile, false);
    return { user: this.sanitizeUser(profile), ...tokens };
  }

  async login(dto: any) {
    let user: any;
    if (dto.phone) {
      user = await this.farmerRepo
        .createQueryBuilder("f")
        .addSelect("f.passwordHash")
        .where("f.phone = :phone", { phone: dto.phone })
        .getOne();
    } else {
      user = await this.buyerRepo
        .createQueryBuilder("b")
        .addSelect(["b.passwordHash", "b.totpSecret", "b.totpEnabled"])
        .where("b.email = :email", { email: dto.email })
        .getOne();
    }

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException("Identifiants incorrects");
    }
    if (dto.phone && !user.isActive) {
      throw new UnauthorizedException("Identifiants incorrects");
    }

    if (user.totpEnabled) {
      const loginToken = this.jwtService.sign(
        { sub: user.id, role: user.role || "buyer", totpChallenge: true },
        { expiresIn: "5m" },
      );
      return { totpRequired: true, loginToken };
    }

    const tokens = this.generateTokens(user, dto.rememberMe);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async verifyTotpChallenge(loginToken: string, code: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(loginToken);
    } catch {
      throw new UnauthorizedException("Session expirée, veuillez vous reconnecter");
    }
    if (!payload.totpChallenge) {
      throw new UnauthorizedException("Jeton invalide");
    }

    const user = await this.buyerRepo
      .createQueryBuilder("b")
      .addSelect(["b.totpSecret", "b.totpEnabled"])
      .where("b.id = :id", { id: payload.sub })
      .getOne();

    if (!user || !user.totpEnabled || !user.totpSecret) {
      throw new BadRequestException("2FA non configuré");
    }

    const valid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!valid) {
      throw new UnauthorizedException("Code invalide ou expiré");
    }

    const tokens = this.generateTokens(user, false);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async generateTotpSecret(userId: string, password: string) {
    const user = await this.buyerRepo
      .createQueryBuilder("b")
      .addSelect("b.passwordHash")
      .where("b.id = :id", { id: userId })
      .getOne();
    if (!user) throw new UnauthorizedException();
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Mot de passe incorrect");
    }

    const secret = authenticator.generateSecret();
    const appName = "ATB AgriTrace";
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);
    const qrCode = await QRCode.toDataURL(otpauthUrl);

    return { secret, otpauthUrl, qrCode };
  }

  async enableTotp(userId: string, code: string) {
    const user = await this.buyerRepo
      .createQueryBuilder("b")
      .addSelect("b.totpSecret")
      .where("b.id = :id", { id: userId })
      .getOne();
    if (!user || !user.totpSecret) {
      throw new BadRequestException("Générez d'abord un secret 2FA");
    }

    const valid = authenticator.verify({ token: code, secret: user.totpSecret });
    if (!valid) {
      throw new BadRequestException("Code invalide. Vérifiez votre application d'authentification.");
    }

    await this.buyerRepo.update(userId, { totpEnabled: true });
    return { success: true };
  }

  async disableTotp(userId: string, password: string) {
    const user = await this.buyerRepo
      .createQueryBuilder("b")
      .addSelect("b.passwordHash")
      .where("b.id = :id", { id: userId })
      .getOne();
    if (!user) throw new UnauthorizedException();
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Mot de passe incorrect");
    }

    await this.buyerRepo.update(userId, { totpSecret: null as any, totpEnabled: false });
    return { success: true };
  }

  async getTotpStatus(userId: string) {
    const user = await this.buyerRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { totpEnabled: user.totpEnabled };
  }

  async adminLogin(dto: any) {
    const user = await this.adminRepo
      .createQueryBuilder("admin")
      .addSelect("admin.passwordHash")
      .where("admin.username = :username", { username: dto.username })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)) || !user.isActive) {
      throw new UnauthorizedException("Identifiants incorrects");
    }

    const tokens = this.generateTokens(user, dto.rememberMe);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.farmerRepo.findOne({
        where: { id: payload.sub },
      });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Identifiants incorrects");
    }
  }

  async forgotPassword(email: string) {
    return { message: "Si ce compte existe, un lien de réinitialisation a été envoyé." };
  }

  async getProfile(id: string) {
    const profile =
      (await this.farmerRepo.findOne({ where: { id } })) ||
      (await this.buyerRepo.findOne({ where: { id } })) ||
      null;
    if (profile && profile.constructor?.name === "BuyerProfile") {
      const status = await this.getTotpStatus(id);
      return { ...profile, totpEnabled: status.totpEnabled };
    }
    return profile;
  }

  async updateProfile(id: string, data: any) {
    await this.farmerRepo.update(id, data);
    return this.getProfile(id);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  private generateTokens(user: any, rememberMe = false) {
    const payload = { sub: user.id, role: user.role || "farmer" };
    const accessExpiry = "15m";
    const refreshExpiry = rememberMe ? "30d" : "24h";
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: accessExpiry }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: refreshExpiry }),
      expiresIn: rememberMe ? 2592000 : 86400,
    };
  }
}
