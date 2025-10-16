import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: { userId: string },
  ) {
    const post = await this.postsService.create(createPostDto, user.userId);
    return { data: post };
  }

  @Get()
  @Public()
  async findAll(@CurrentUser() user?: { userId: string }) {
    const posts = await this.postsService.findAll(user?.userId);
    return { data: posts };
  }

  @Get(':id')
  @Public()
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: { userId: string },
  ) {
    const post = await this.postsService.findOne(id, user?.userId);
    return { data: post };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: { userId: string },
  ) {
    const post = await this.postsService.update(id, updatePostDto, user.userId);
    return { data: post };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.postsService.remove(id, user.userId);
    return { data: { message: 'Post deleted successfully' } };
  }
}
