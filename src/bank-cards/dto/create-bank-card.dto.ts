import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateBankCardDto {
  @IsNotEmpty()
  @IsString()
  bankName: string;

  @IsNotEmpty()
  @IsString()
  accountNumber: string;

  @IsNotEmpty()
  @IsString()
  accountHolder: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
