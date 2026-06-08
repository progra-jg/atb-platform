import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class InitiatePayoutDto {
  @IsString() paymentId: string;
  @IsString() orderId: string;
  @IsString() producteurId: string;
  @IsNumber() @Min(1) @Max(100_000_000) amount: number;
  @IsOptional() @IsString() currency?: string;
  @IsString() method: string;
  @IsString() provider: string;
  @IsString() phone: string;
  @IsOptional() @IsString() idempotencyKey?: string;
}

export class PayoutFilterDto {
  @IsOptional() @IsString() producteurId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}
