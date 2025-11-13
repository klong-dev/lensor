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
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ImageProcessingService } from './image-processing.service';
import { multerConfig } from '../config/multer.config';
import { getFile, getFileByGroupFileName } from '../libs/uploadFile';

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
    files: Express.Multer.File[],
    @CurrentUser() user: { userId: string },
  ) {
    // Process main image if uploaded
    if (files) {
      const productImage = getFile(files, 'image');
      if (!productImage) {
        throw new Error('Product image file not found');
      }
      if (user) {
        try {
          const result = await this.imageProcessingService.processSingleImage(
            productImage,
            user.userId,
          );
          // Set image and thumbnail URLs from Python service
          createProductDto.image = result.original;
          createProductDto.thumbnail = result.thumbnail;

          // Store comprehensive image metadata
          if (result.metadata) {
            createProductDto['imageMetadata'] = result.metadata;
          }
        } catch (error) {
          console.error(
            'Error details:',
            error.response?.data || error.message,
          );
          throw error;
        }
      }
    } else {
      console.log('ℹ️ No main file uploaded');
    }

    // Process imagePairs if uploaded
    const imagePairs = getFileByGroupFileName(files, 'imagePairs');
    if (imagePairs) {
      try {
        // Group images into pairs (every 2 images = 1 pair)
        // Assuming files are uploaded in order: before1, after1, before2, after2, etc.
        const pairs: Array<{ before: string; after: string }> = [];
        for (const imagePair of imagePairs) {
          const processedBefore =
            await this.imageProcessingService.processSingleImage(
              imagePair.before,
              user.userId,
            );
          const processedAfter =
            await this.imageProcessingService.processSingleImage(
              imagePair.after,
              user.userId,
            );
          pairs.push({
            before: processedBefore.original,
            after: processedAfter.original,
          });
        }

        createProductDto.imagePairs = pairs;
      } catch (error) {
        console.log('❌ ImagePairs processing failed:', error);
        throw error;
      }
    }

    // Process preset files if uploaded (.xmp, .lrtemplate, .dcp)
    const presetFiles = files?.filter(
      (file) =>
        file.fieldname === 'presetFiles' ||
        file.fieldname.startsWith('presetFiles['),
    );

    if (presetFiles && presetFiles.length > 0) {
      try {
        const uploadedPresets: string[] = [];
        const allowedExtensions = ['.xmp', '.lrtemplate', '.dcp', '.dng'];

        for (const presetFile of presetFiles) {
          const fileExt = presetFile.originalname
            .toLowerCase()
            .substring(presetFile.originalname.lastIndexOf('.'));

          // Validate file extension
          if (!allowedExtensions.includes(fileExt)) {
            console.warn(
              `⚠️ Skipping invalid preset file: ${presetFile.originalname}. Allowed: ${allowedExtensions.join(', ')}`,
            );
            continue;
          }

          // Upload preset file to storage (direct upload without image processing)
          const result = await this.imageProcessingService.uploadPresetFile(
            presetFile,
            user.userId,
          );

          uploadedPresets.push(result.url);
          console.log(
            `✅ Preset file uploaded: ${presetFile.originalname} -> ${result.url}`,
          );
        }

        if (uploadedPresets.length > 0) {
          createProductDto.presetFiles = uploadedPresets;
          console.log(
            `✅ Total ${uploadedPresets.length} preset files uploaded`,
          );
        }
      } catch (error) {
        console.error('❌ Preset files upload failed:', error);
        // Don't throw error - preset files are optional
        // throw error;
      }
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

  @Get('products/me')
  async findMyProducts(@CurrentUser() user: { userId: string; email: string }) {
    const products = await this.productsService.findByUser(user.userId);
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
