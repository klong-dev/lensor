import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ImageProcessingService } from '../products/image-processing.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() image: Express.Multer.File,
    @CurrentUser() user: { userId: string },
    @Req() req: any,
  ) {
    // Process image if uploaded
    if (image) {
      console.log('📁 Post image uploaded:', {
        filename: image.originalname,
        mimetype: image.mimetype,
        size: image.size,
      });

      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (token) {
        try {
          console.log('🔄 Processing post image...');
          const result = await this.imageProcessingService.processSingleImage(
            image,
            token,
          );

          console.log('✅ Post image processed:', result);

          // Set image and thumbnail URLs from Python service
          createPostDto.imageUrl = result.original;
          createPostDto.thumbnailUrl = result.thumbnail;
        } catch (error) {
          console.error('❌ Post image processing failed:', error);
          console.error(
            'Error details:',
            error.response?.data || error.message,
          );
        }
      }
    } else {
      console.log('ℹ️ No image uploaded for post');
    }

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
