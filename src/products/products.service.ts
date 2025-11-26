import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Order } from 'src/orders/entities/order.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    private supabaseService: SupabaseService,
    private notificationsService: NotificationsService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    const product = this.productRepository.create({
      ...createProductDto,
      userId,
      imagePairs: createProductDto.imagePairs
        ? JSON.stringify(createProductDto.imagePairs)
        : null,
      presetFiles: createProductDto.presetFiles
        ? JSON.stringify(createProductDto.presetFiles)
        : null,
      tags: createProductDto.tags ? createProductDto.tags.join(',') : null,
      compatibility: createProductDto.compatibility
        ? createProductDto.compatibility.join(',')
        : null,
      features: createProductDto.features
        ? createProductDto.features.join(',')
        : null,
      specifications: createProductDto.specifications
        ? JSON.stringify(createProductDto.specifications)
        : null,
      warranty: createProductDto.warranty
        ? JSON.stringify(createProductDto.warranty)
        : null,
    });

    const savedProduct = await this.productRepository.save(product);

    return {
      ...savedProduct,
      imagePairs: savedProduct.imagePairs
        ? JSON.parse(savedProduct.imagePairs)
        : [],
      presetFiles: savedProduct.presetFiles
        ? JSON.parse(savedProduct.presetFiles)
        : [],
    };
  }

  async findAll() {
    const products = await this.productRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      products.map(async (product) => {
        const author = await this.supabaseService.getUserById(product.userId);

        return {
          id: product.id,
          title: product.title,
          description: product.description,
          price: Number(product.price),
          image: product.image || '/images/default-product.jpg',
          thumbnail:
            product.thumbnail || product.image || '/images/default-product.jpg',
          author: {
            id: author?.id || product.userId,
            name:
              author?.user_metadata?.name || author?.email || 'Unknown User',
            avatar:
              author?.user_metadata?.avatar_url || '/images/default_avatar.jpg',
          },
          rating: Number(product.rating),
          reviewCount: product.reviewCount,
          sellCount: product.sellCount,
          category: product.category,
          status: product.status,
        };
      }),
    );
  }

  async findByUser(userId: string) {
    const products = await this.productRepository.find({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });

    return Promise.all(
      products.map(async (product) => {
        return {
          id: product.id,
          title: product.title,
          description: product.description,
          price: Number(product.price),
          originalPrice: product.originalPrice
            ? Number(product.originalPrice)
            : Number(product.price),
          discount: product.discount,
          image: product.image || '/images/default-product.jpg',
          thumbnail:
            product.thumbnail || product.image || '/images/default-product.jpg',
          rating: Number(product.rating),
          reviewCount: product.reviewCount,
          sellCount: product.sellCount,
          downloads: product.downloads,
          category: product.category,
          status: product.status,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      }),
    );
  }

  async findOne(id: string, userId?: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['reviews'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const author = await this.supabaseService.getUserById(product.userId);

    // Count total products by this author
    const totalProducts = await this.productRepository.count({
      where: { userId: product.userId, deletedAt: IsNull() },
    });

    // Parse JSON fields
    const imagePairs = product.imagePairs ? JSON.parse(product.imagePairs) : [];
    const presetFiles = product.presetFiles
      ? JSON.parse(product.presetFiles)
      : [];
    // simple-array types are already arrays from TypeORM
    const tags = Array.isArray(product.tags)
      ? product.tags
      : product.tags
        ? String(product.tags).split(',')
        : [];
    const compatibility = Array.isArray(product.compatibility)
      ? product.compatibility
      : product.compatibility
        ? String(product.compatibility).split(',')
        : [];
    const features = Array.isArray(product.features)
      ? product.features
      : product.features
        ? String(product.features).split(',')
        : [];
    const specifications = product.specifications
      ? JSON.parse(product.specifications)
      : {};
    const warranty = product.warranty ? JSON.parse(product.warranty) : {};

    // Format reviews
    const reviews = (product.reviews || [])
      .filter((review) => !review.deletedAt)
      .map((review) => ({
        id: review.id,
        userName: review.userName,
        userAvatar: review.userAvatar || '/images/default_avatar.jpg',
        rating: Number(review.rating),
        date: review.createdAt.toISOString(),
        comment: review.comment,
        helpful: review.helpful,
      }));

    let isUserBought = false;
    if (userId) {
      const userOrders = await this.orderRepository.find({
        where: { userId: userId },
      });

      for (const order of userOrders) {
        const items = order.items || [];
        if (
          items &&
          items.length > 0 &&
          items.find((item) => item.productId === id)
        ) {
          isUserBought = true;
          break;
        }
      }
    }

    return {
      id: product.id,
      name: product.title,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : Number(product.price),
      discount: product.discount,
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      downloads: product.downloads,
      sellCount: product.sellCount,
      author: {
        id: author?.id || product.userId,
        name: author?.user_metadata?.name || author?.email || 'Unknown User',
        avatar:
          author?.user_metadata?.avatar_url || '/images/default_avatar.jpg',
        verified: author?.verified || false,
        totalProducts,
      },
      image: product.image,
      thumbnail: product.thumbnail,
      imagePairs: imagePairs ? JSON.parse(JSON.stringify(imagePairs)) : [],
      imageMetadata: product.imageMetadata || null,
      // presetFiles removed - only available after purchase
      category: product.category,
      tags,
      compatibility,
      fileFormat: product.fileFormat,
      fileSize: product.fileSize,
      includesCount: product.includesCount,
      features,
      specifications,
      status: product.status,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      warranty,
      isUserBought,
      reviews: isUserBought ? reviews : [],
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    console.log('🔍 Finding product:', id);

    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    console.log('📝 Building update data...');
    const updateData: any = {};

    // Only update fields that are provided
    if (updateProductDto.title !== undefined) {
      updateData.title = updateProductDto.title;
    }
    if (updateProductDto.description !== undefined) {
      updateData.description = updateProductDto.description;
    }
    if (updateProductDto.price !== undefined) {
      updateData.price = updateProductDto.price;
    }
    if (updateProductDto.originalPrice !== undefined) {
      updateData.originalPrice = updateProductDto.originalPrice;
    }
    if (updateProductDto.discount !== undefined) {
      updateData.discount = updateProductDto.discount;
    }
    if (updateProductDto.category !== undefined) {
      updateData.category = updateProductDto.category;
    }
    if (updateProductDto.fileFormat !== undefined) {
      updateData.fileFormat = updateProductDto.fileFormat;
    }
    if (updateProductDto.fileSize !== undefined) {
      updateData.fileSize = updateProductDto.fileSize;
    }
    if (updateProductDto.includesCount !== undefined) {
      updateData.includesCount = updateProductDto.includesCount;
    }

    // Handle image updates
    if (updateProductDto.image !== undefined) {
      updateData.image = updateProductDto.image;
    }
    if (updateProductDto.thumbnail !== undefined) {
      updateData.thumbnail = updateProductDto.thumbnail;
    }

    // Handle imageMetadata
    if (updateProductDto['imageMetadata'] !== undefined) {
      updateData.imageMetadata = updateProductDto['imageMetadata'];
    }

    // Handle JSON/Array fields with proper serialization
    if (updateProductDto.imagePairs !== undefined) {
      updateData.imagePairs = JSON.stringify(updateProductDto.imagePairs);
    }

    if (updateProductDto.presetFiles !== undefined) {
      updateData.presetFiles = JSON.stringify(updateProductDto.presetFiles);
    }

    if (updateProductDto.tags !== undefined) {
      updateData.tags = Array.isArray(updateProductDto.tags)
        ? updateProductDto.tags.join(',')
        : updateProductDto.tags;
    }

    if (updateProductDto.compatibility !== undefined) {
      updateData.compatibility = Array.isArray(updateProductDto.compatibility)
        ? updateProductDto.compatibility.join(',')
        : updateProductDto.compatibility;
    }

    if (updateProductDto.features !== undefined) {
      updateData.features = Array.isArray(updateProductDto.features)
        ? updateProductDto.features.join(',')
        : updateProductDto.features;
    }

    if (updateProductDto.specifications !== undefined) {
      updateData.specifications = JSON.stringify(
        updateProductDto.specifications,
      );
    }

    if (updateProductDto.warranty !== undefined) {
      updateData.warranty = JSON.stringify(updateProductDto.warranty);
    }

    console.log('💾 Updating product in database...');
    console.log('Update data:', Object.keys(updateData));

    try {
      // Update the product
      await this.productRepository.update(id, updateData);
      console.log('✅ Product updated successfully');

      // Fetch and return the updated product
      const updatedProduct = await this.findOne(id);
      return updatedProduct;
    } catch (error) {
      console.error('❌ Error updating product:', error);
      throw new BadRequestException(
        `Failed to update product: ${error.message}`,
      );
    }
  }

  async remove(id: string, userId: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.userId !== userId) {
      throw new NotFoundException(
        'You do not have permission to delete this product',
      );
    }

    await this.productRepository.update(id, { deletedAt: new Date() });
  }

  async findOneWithDownloadLinks(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const author = await this.supabaseService.getUserById(product.userId);

    // Parse JSON fields
    const imagePairs = product.imagePairs ? JSON.parse(product.imagePairs) : [];
    const presetFiles = product.presetFiles
      ? JSON.parse(product.presetFiles)
      : [];
    const tags = Array.isArray(product.tags)
      ? product.tags
      : product.tags
        ? String(product.tags).split(',')
        : [];
    const compatibility = Array.isArray(product.compatibility)
      ? product.compatibility
      : product.compatibility
        ? String(product.compatibility).split(',')
        : [];
    const features = Array.isArray(product.features)
      ? product.features
      : product.features
        ? String(product.features).split(',')
        : [];
    const specifications = product.specifications
      ? JSON.parse(product.specifications)
      : {};
    const warranty = product.warranty ? JSON.parse(product.warranty) : {};

    return {
      id: product.id,
      name: product.title,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : Number(product.price),
      discount: product.discount,
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      downloads: product.downloads,
      sellCount: product.sellCount,
      author: {
        name: author?.user_metadata?.name || author?.email || 'Unknown User',
        avatar:
          author?.user_metadata?.avatar_url || '/images/default_avatar.jpg',
      },
      image: product.image,
      thumbnail: product.thumbnail,
      imagePairs,
      imageMetadata: product.imageMetadata || null,
      presetFiles, // Include preset files for download
      category: product.category,
      tags,
      compatibility,
      fileFormat: product.fileFormat,
      fileSize: product.fileSize,
      includesCount: product.includesCount,
      features,
      specifications,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      warranty,
    };
  }

  // Review methods
  async createReview(
    productId: string,
    userId: string,
    rating: number,
    comment: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const user = await this.supabaseService.getUserById(userId);

    let isUserBought = false;
    if (userId) {
      const userOrders = await this.orderRepository.find({
        where: { userId: userId },
      });

      for (const order of userOrders) {
        const items = order.items || [];
        if (
          items &&
          items.length > 0 &&
          items.find((item) => item.productId === productId)
        ) {
          isUserBought = true;
          break;
        }
      }
    }

    if (!isUserBought) {
      throw new BadRequestException(
        'You can only review products you have purchased',
      );
    }

    const review = this.reviewRepository.create({
      productId,
      userId,
      userName: user?.user_metadata?.name || user?.email || 'Anonymous',
      userAvatar: user?.user_metadata?.avatar_url,
      rating,
      comment,
    });

    await this.reviewRepository.save(review);

    // Update product rating and review count
    await this.updateProductRating(productId);

    return review;
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.reviewRepository.find({
      where: { productId, deletedAt: IsNull() },
    });

    const totalRating = reviews.reduce(
      (sum, review) => sum + Number(review.rating),
      0,
    );
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await this.productRepository.update(productId, {
      rating: avgRating,
      reviewCount: reviews.length,
    });
  }

  // ADMIN METHODS
  async handleAdminAction(productId: string, action: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: IsNull() },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (action === 'block') {
      if (product.status === 'blocked')
        throw new BadRequestException('Product is already blocked');
      product.status = 'blocked';
      await this.productRepository.save(product);

      // Notify the user about the block
      await this.notificationsService.createNotification(
        product.userId,
        'product_blocked_by_admin',
        'Product Blocked',
        `Your product "${product.title}" has been blocked by the admin.`,
      );
      return;
    }

    if (action === 'unblock') {
      if (product.status !== 'blocked')
        throw new BadRequestException('Product is not blocked');
      product.status = 'active';
      await this.productRepository.save(product);

      // Notify the user about the block
      await this.notificationsService.createNotification(
        product.userId,
        'product_unblocked_by_admin',
        'Product Unblocked',
        `Your product "${product.title}" has been unblocked by the admin.`,
      );
      return;
    }

    if (action === 'delete') {
      await this.productRepository.update(productId, {
        deletedAt: new Date(),
      });
      return;
    }
  }
}
