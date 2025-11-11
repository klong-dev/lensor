import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ImageProcessingService } from '../products/image-processing.service';

@Module({
  controllers: [UploadsController],
  providers: [ImageProcessingService],
})
export class UploadsModule {}
