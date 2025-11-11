import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuthLoginDto {
  @IsEnum(['google', 'facebook', 'github'], {
    message: 'Provider must be one of: google, facebook, github',
  })
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  redirectTo?: string;
}
