import { IsString, IsNumber, IsOptional, IsArray, Min } from "class-validator";

export class UpdateParcelleDto {
  @IsOptional()
  @IsArray()
  polygone?: number[][][];

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  superficie?: number;

  @IsOptional()
  @IsString()
  culture?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsArray()
  photos?: string[];
}
