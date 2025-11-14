import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsString()
  reason: string;

  @IsOptional()
  evidence?: string[]; // Array of URLs
}
