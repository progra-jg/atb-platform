import { IsString, IsNumber, IsOptional, Min, Max } from "class-validator";

export class GeneratePredictionDto {
  @IsString() crop: string;
  @IsString() region: string;
  @IsOptional() @IsNumber() @Min(1) @Max(365) days?: number;
}

export class PredictionFilterDto {
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}
