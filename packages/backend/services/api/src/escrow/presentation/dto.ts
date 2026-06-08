import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, IsUUID, IsIn } from "class-validator";

export class CreateEscrowDto {
  @IsUUID() @IsString() orderId: string;
  @IsString() buyerId: string;
  @IsString() producteurId: string;
  @IsNumber() @Min(1) @Max(10_000_000) amount: number;
  @IsOptional() @IsString() @IsIn(["USDT", "USDC"]) currency?: string = "USDT";
  @IsOptional() @IsString() @IsIn(["TRC-20", "Polygon", "BEP-20"]) network?: string = "TRC-20";
  @IsOptional() @IsString() terms?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(5) feePercentage?: number = 0.5;
}

export class FundEscrowDto {
  @IsString() buyerId: string;
}

export class MarkDeliveredDto {
  @IsString() producteurId: string;
  @IsOptional() @IsString() producteurSignature?: string;
}

export class ConfirmDeliveryDto {
  @IsString() buyerId: string;
  @IsOptional() @IsString() buyerSignature?: string;
}

export class ReleaseEscrowDto {
  @IsString() adminId: string;
}

export class RaiseDisputeDto {
  @IsString() raisedBy: string;
  @IsString() reason: string;
  @IsOptional() @IsString() evidence?: string;
}

export class ResolveDisputeDto {
  @IsString() adminId: string;
  @IsString() @IsIn(["release_to_seller", "refund_buyer", "split"]) resolution: string;
}

export class CancelEscrowDto {
  @IsString() buyerId: string;
  @IsOptional() @IsString() reason?: string;
}

export class EscrowFilterDto {
  @IsOptional() @IsString() buyerId?: string;
  @IsOptional() @IsString() producteurId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsBoolean() disputed?: boolean;
}
