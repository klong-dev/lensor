import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  type?: string; // 'direct' or 'group'

  participantIds?: string[];
}
