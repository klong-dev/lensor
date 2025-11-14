import {
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateWithdrawalDto {
  @IsNotEmpty()
  @IsUUID()
  bankCardId: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds: string[];

  @IsOptional()
  @IsString()
  note?: string;
}
