import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VoteService } from './vote.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('votes')
@UseGuards(JwtAuthGuard)
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  @Post()
  async create(
    @Body() createVoteDto: CreateVoteDto,
    @CurrentUser() user: { userId: string },
  ) {
    const vote = await this.voteService.create(createVoteDto, user.userId);
    return {
      data: vote,
      message: vote ? 'Vote recorded' : 'Vote removed',
    };
  }

  @Get('target/:targetId')
  @Public()
  async findByTarget(
    @Param('targetId') targetId: string,
    @Query('type') targetType: string,
  ) {
    const voteData = await this.voteService.findByTarget(targetId, targetType);
    return { data: voteData };
  }

  @Get('target/:targetId/user')
  async getUserVote(
    @Param('targetId') targetId: string,
    @Query('type') targetType: string,
    @CurrentUser() user: { userId: string },
  ) {
    const vote = await this.voteService.getUserVote(
      targetId,
      targetType,
      user.userId,
    );
    return { data: vote };
  }

  @Delete('target/:targetId')
  async remove(
    @Param('targetId') targetId: string,
    @Query('type') targetType: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.voteService.remove(targetId, targetType, user.userId);
    return { data: { message: 'Vote removed successfully' } };
  }
}
