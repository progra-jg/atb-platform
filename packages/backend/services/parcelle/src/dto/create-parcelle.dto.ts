import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  ArrayMinSize,
} from "class-validator";

export class CreateParcelleDto {
  @IsArray()
  @ArrayMinSize(1)
  polygone: number[][][];

  @IsNumber()
  @Min(0.01)
  superficie: number;

  @IsString()
  culture: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsArray()
  photos?: string[];
}
