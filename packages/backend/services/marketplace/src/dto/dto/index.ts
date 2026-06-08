import { IsString, IsNumber, IsArray, IsOptional, Min, ArrayMinSize } from "class-validator";

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateOrderDto {
  @IsString()
  producteurId: string;

  @IsArray()
  @ArrayMinSize(1)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  deliveryGps?: string;
}

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateOrderStatusDto {
  @IsString()
  status: string;
}
