import { IsNotEmpty, IsUUID, IsArray } from 'class-validator';

export class CheckWithdrawalDto {
  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  orderIds: string[];
}
