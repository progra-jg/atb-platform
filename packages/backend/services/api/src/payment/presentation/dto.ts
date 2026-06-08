import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, IsUUID } from "class-validator";
import { PaymentMethod, PaymentProviderId, Currency } from "../domain/types";

export class InitiatePaymentDto {
  @IsUUID() @IsString() orderId: string;
  @IsOptional() @IsString() contractId?: string;
  @IsOptional() @IsString() buyerId?: string;
  @IsOptional() @IsString() producteurId?: string;
  @IsNumber() @Min(1) @Max(100_000_000) amount: number;
  @IsOptional() @IsString() currency?: string = "XOF";
  @IsString() method: string;
  @IsString() provider: string;
  @IsOptional() @IsString() idempotencyKey?: string;
  @IsOptional() @IsString() phone?: string;
}

export class PaymentFilterDto {
  @IsOptional() @IsString() buyerId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

export class VerifyPaymentDto {
  @IsString() adminId: string;
}

export class IdempotencyResponse {
  constructor(public readonly key: string, public readonly statusCode: number, public readonly body: any) {}
}
