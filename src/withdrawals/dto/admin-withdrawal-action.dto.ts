import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class AdminWithdrawalActionDto {
  @IsNotEmpty()
  @IsIn(['approved', 'rejected'])
  action: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  adminResponse?: string;
}
