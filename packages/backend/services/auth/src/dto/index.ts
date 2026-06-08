import { IsString, IsEmail, IsOptional, IsPhoneNumber, MinLength, IsBoolean } from "class-validator";

export class RegisterDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  role: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  gpsCoordinates?: { lat: number; lng: number };

  @IsOptional()
  languages?: string[];

  @IsOptional()
  @IsString()
  cooperativeId?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  accreditations?: string[];

  @IsOptional()
  @IsString()
  walletAddress?: string;
}

export class LoginDto {
  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class AdminLoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  languages?: string[];
}

export class TotpChallengeDto {
  @IsString()
  loginToken: string;

  @IsString()
  code: string;
}

export class TotpSetupDto {
  @IsString()
  @MinLength(6)
  password: string;
}

export class TotpVerifyDto {
  @IsString()
  code: string;
}

export class TotpDisableDto {
  @IsString()
  @MinLength(6)
  password: string;
}
