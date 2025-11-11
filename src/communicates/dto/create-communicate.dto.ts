import { IsString, IsUUID, IsOptional, IsIn } from 'class-validator';

export class CreateCommunicateDto {
  @IsUUID()
  forumId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'restricted'])
  type?: string;
}
