import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class WebhookDto {
  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  orderCode: number;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  code: string;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  success: boolean;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  desc: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  transactionDateTime?: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  signature?: string;
}
