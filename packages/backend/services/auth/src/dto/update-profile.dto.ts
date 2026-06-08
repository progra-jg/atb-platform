import { IsString, IsOptional, IsArray } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  village?: string;

  @IsOptional()
  @IsArray()
  languages?: string[];
}
