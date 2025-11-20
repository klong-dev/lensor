import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserFollowDto {
  @IsOptional()
  @IsBoolean()
  notifyOnPost?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnComment?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnVote?: boolean;
}
