import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty, IsString, IsNumber, IsUUID, IsBoolean,
  IsOptional, Min, IsPositive,
} from 'class-validator';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Wireless Mouse' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'SKU-001' })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiProperty({ example: 'A premium wireless mouse' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 10, description: 'Alert when stock falls below this' })
  @IsNumber()
  @Min(0)
  minStockLevel: number;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 'uuid-of-supplier' })
  @IsNotEmpty()
  @IsString()
  supplierId: string;

  @ApiProperty({ example: 'Electronics' })
  @IsNotEmpty()
  @IsString()
  category: string;
}

export class UpdateInventoryItemDto extends PartialType(CreateInventoryItemDto) {}

export class AdjustStockDto {
  @ApiProperty({ example: 25, description: 'Positive to add, negative to deduct' })
  @IsNumber()
  adjustment: number;

  @ApiProperty({ example: 'Restocked from supplier', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
