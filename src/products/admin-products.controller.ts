import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { UploadService } from '../upload/upload.service';
import { AdminActionDto } from './dto/admin-action.dto';
import { ProductsService } from './products.service';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminProductsController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly productsService: ProductsService,
  ) {}

  @Post('/:id/action')
  async adminAction(
    @Param('id') productId: string,
    @Body() adminActionDto: AdminActionDto,
  ) {
    const withdrawal = await this.productsService.handleAdminAction(
      productId,
      adminActionDto.action,
    );
    return {
      data: withdrawal,
      message: `Product ${adminActionDto.action} successfully`,
    };
  }
}
