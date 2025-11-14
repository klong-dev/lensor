import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateBankCardDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
