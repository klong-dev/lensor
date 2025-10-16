import { IsEnum, IsNotEmpty, IsUUID, IsIn } from 'class-validator';
import { VoteType, VoteValue } from '../entities/vote.entity';

export class CreateVoteDto {
  @IsUUID()
  @IsNotEmpty()
  targetId: string;

  @IsEnum(VoteType)
  @IsNotEmpty()
  targetType: VoteType;

  @IsIn([VoteValue.UP, VoteValue.DOWN])
  @IsNotEmpty()
  value: VoteValue;
}
