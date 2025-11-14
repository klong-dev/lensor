import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class AdminWithdrawalActionDto {
  @IsNotEmpty()
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  adminResponse?: string;
}
