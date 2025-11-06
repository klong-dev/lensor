import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
  FileFieldsInterceptor,
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ImageProcessingService } from './image-processing.service';
import { multerConfig } from '../config/multer.config';

@Controller()
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @Post('products')
  @UseInterceptors(AnyFilesInterceptor(multerConfig))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      file?: Express.Multer.File[];
      imagePairs?: Express.Multer.File[];
    },
    @CurrentUser() user: { userId: string },
    @Req() req: any,
  ) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    // Process main image if uploaded
    if (files?.file?.[0]) {
      const mainFile = files.file[0];
      console.log('📁 Main file uploaded:', {
        filename: mainFile.originalname,
        mimetype: mainFile.mimetype,
        size: mainFile.size,
      });

      if (token) {
        try {
          console.log('🔄 Processing main image...');
          const result = await this.imageProcessingService.processSingleImage(
            mainFile,
            token,
          );

          console.log('✅ Main image processed:', result);

          // Set image and thumbnail URLs from Python service
          createProductDto.image = result.original;
          createProductDto.thumbnail = result.thumbnail;
        } catch (error) {
          console.error('❌ Main image processing failed:', error);
          console.error(
            'Error details:',
            error.response?.data || error.message,
          );
        }
      }
    } else {
      console.log('ℹ️ No main file uploaded');
    }

    // Process imagePairs if uploaded
    if (files?.imagePairs && files.imagePairs.length > 0) {
      console.log(`📁 ImagePairs uploaded: ${files.imagePairs.length} files`);

      if (token) {
        try {
          console.log('🔄 Processing imagePairs...');

          // Process all imagePair files
          const processedImages =
            await this.imageProcessingService.processMultipleImages(
              files.imagePairs,
              token,
            );

          console.log(
            `✅ ImagePairs processed: ${processedImages.successful} successful`,
          );

          // Group images into pairs (every 2 images = 1 pair)
          // Assuming files are uploaded in order: before1, after1, before2, after2, etc.
          const pairs: Array<{ before: string; after: string }> = [];
          for (let i = 0; i < processedImages.uploaded.length; i += 2) {
            if (i + 1 < processedImages.uploaded.length) {
              pairs.push({
                before: processedImages.uploaded[i].original,
                after: processedImages.uploaded[i + 1].original,
              });
            }
          }

          createProductDto.imagePairs = pairs;
          console.log(`✅ Created ${pairs.length} image pairs`);
        } catch (error) {
          console.error('❌ ImagePairs processing failed:', error);
          console.error(
            'Error details:',
            error.response?.data || error.message,
          );
        }
      }
    } else {
      console.log('ℹ️ No imagePairs uploaded');
    }

    const product = await this.productsService.create(
      createProductDto,
      user.userId,
    );
    return { data: product };
  }

  @Get('marketplaces')
  @Public()
  async findAllMarketplace() {
    const products = await this.productsService.findAll();
    return { data: products };
  }

  @Get('products')
  @Public()
  async findAll() {
    const products = await this.productsService.findAll();
    return { data: products };
  }

  @Get('products/:id')
  @Public()
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const product = await this.productsService.findOne(id);
    return { data: product };
  }

  @Patch('products/:id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: { userId: string },
  ) {
    const product = await this.productsService.update(
      id,
      updateProductDto,
      user.userId,
    );
    return { data: product };
  }

  @Delete('products/:id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.productsService.remove(id, user.userId);
    return { data: { message: 'Product deleted successfully' } };
  }

  @Post('products/:id/reviews')
  async createReview(
    @Param('id', ParseUUIDPipe) productId: string,
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: { userId: string },
  ) {
    const review = await this.productsService.createReview(
      productId,
      user.userId,
      createReviewDto.rating,
      createReviewDto.comment,
    );
    return { data: review };
  }

  @Post('products/upload-image')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return { error: 'Authorization header required' };
    }

    const result = await this.imageProcessingService.processSingleImage(
      file,
      authHeader.split(' ')[1],
    );

    return {
      data: {
        image: result.original,
        thumbnail: result.thumbnail,
      },
    };
  }
}
