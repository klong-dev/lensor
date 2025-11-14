import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class AdminActionDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['approved', 'rejected', 'need_more_info'])
  action: 'approved' | 'rejected' | 'need_more_info';

  @IsOptional()
  @IsString()
  adminResponse?: string; // Required for rejected or need_more_info
}
