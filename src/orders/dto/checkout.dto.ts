import { IsNotEmpty, IsUUID, IsArray, IsOptional } from 'class-validator';

export class CheckOutOrderDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];
}
