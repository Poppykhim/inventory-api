import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Tech Supplies Co.' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'contact@techsupplies.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1-555-0100' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Supplier Ave, NY 10001' })
  @IsNotEmpty()
  @IsString()
  address: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
