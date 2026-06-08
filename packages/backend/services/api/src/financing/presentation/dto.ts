import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class ApplyForFinancingDto {
  @IsString() offerId: string;
  @IsNumber() @Min(1000) @Max(2000000) amount: number;
  @IsString() collateralType: string;
  @IsOptional() @IsString() collateralRef?: string;
}

export class RepayFinancingDto {
  @IsNumber() @Min(100) amount: number;
  @IsString() transactionRef: string;
}

export class CheckEligibilityQuery {
  @IsString() producteurId: string;
  @IsNumber() @Min(0) @Max(1000) trustScore: number;
}
