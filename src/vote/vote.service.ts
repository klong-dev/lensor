import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVoteDto } from './dto/create-vote.dto';
import { Vote, VoteValue } from './entities/vote.entity';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {}

  async create(createVoteDto: CreateVoteDto, userId: string): Promise<Vote> {
    // Check if user already voted on this target
    const existingVote = await this.voteRepository.findOne({
      where: {
        userId,
        targetId: createVoteDto.targetId,
        targetType: createVoteDto.targetType,
      },
    });

    if (existingVote) {
      // If same value, remove the vote (toggle)
      if (existingVote.value === createVoteDto.value) {
        await this.voteRepository.remove(existingVote);
        return null;
      }

      // Otherwise, update the vote
      existingVote.value = createVoteDto.value;
      return this.voteRepository.save(existingVote);
    }

    // Create new vote
    const vote = this.voteRepository.create({
      ...createVoteDto,
      userId,
    });

    return this.voteRepository.save(vote);
  }

  async findByTarget(targetId: string, targetType: string) {
    const votes = await this.voteRepository.find({
      where: { targetId, targetType: targetType as any },
    });

    const upVotes = votes.filter((v) => v.value === VoteValue.UP).length;
    const downVotes = votes.filter((v) => v.value === VoteValue.DOWN).length;
    const total = upVotes - downVotes;

    return {
      total,
      upVotes,
      downVotes,
      votes,
    };
  }

  async getUserVote(targetId: string, targetType: string, userId: string) {
    const vote = await this.voteRepository.findOne({
      where: {
        targetId,
        targetType: targetType as any,
        userId,
      },
    });

    return vote;
  }

  async remove(
    targetId: string,
    targetType: string,
    userId: string,
  ): Promise<void> {
    const vote = await this.voteRepository.findOne({
      where: {
        targetId,
        targetType: targetType as any,
        userId,
      },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    await this.voteRepository.remove(vote);
  }
}
