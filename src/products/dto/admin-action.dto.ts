import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class AdminActionDto {
  @IsNotEmpty()
  @IsIn(['block', 'unblock', 'rejected'])
  action: 'block' | 'unblock' | 'rejected';

  @IsOptional()
  @IsString()
  adminResponse?: string;
}
