import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductReview } from './entities/product-review.entity';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    private supabaseService: SupabaseService,
  ) {}

  async create(createProductDto: CreateProductDto, userId: string) {
    const product = this.productRepository.create({
      ...createProductDto,
      userId,
      imagePairs: createProductDto.imagePairs
        ? JSON.stringify(createProductDto.imagePairs)
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

    return await this.productRepository.save(product);
  }

  async findAll() {
    const products = await this.productRepository.find({
      where: { deletedAt: null },
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
            name: author?.name || author?.email || 'Unknown User',
            avatar: author?.avatar_url || '/images/default_avatar.jpg',
          },
          rating: Number(product.rating),
          category: product.category,
        };
      }),
    );
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: null },
      relations: ['reviews'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const author = await this.supabaseService.getUserById(product.userId);

    // Count total products by this author
    const totalProducts = await this.productRepository.count({
      where: { userId: product.userId, deletedAt: null },
    });

    // Parse JSON fields
    const imagePairs = product.imagePairs ? JSON.parse(product.imagePairs) : [];
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
      author: {
        name: author?.name || author?.email || 'Unknown User',
        avatar: author?.avatar_url || '/images/default_avatar.jpg',
        verified: author?.verified || false,
        totalProducts,
      },
      imagePairs,
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
      reviews,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (product.userId !== userId) {
      throw new NotFoundException(
        'You do not have permission to update this product',
      );
    }

    const updateData: any = { ...updateProductDto };

    if (updateProductDto.imagePairs) {
      updateData.imagePairs = JSON.stringify(updateProductDto.imagePairs);
    }
    if (updateProductDto.tags) {
      updateData.tags = updateProductDto.tags.join(',');
    }
    if (updateProductDto.compatibility) {
      updateData.compatibility = updateProductDto.compatibility.join(',');
    }
    if (updateProductDto.features) {
      updateData.features = updateProductDto.features.join(',');
    }
    if (updateProductDto.specifications) {
      updateData.specifications = JSON.stringify(
        updateProductDto.specifications,
      );
    }
    if (updateProductDto.warranty) {
      updateData.warranty = JSON.stringify(updateProductDto.warranty);
    }

    await this.productRepository.update(id, updateData);

    return await this.findOne(id);
  }

  async remove(id: string, userId: string) {
    const product = await this.productRepository.findOne({
      where: { id, deletedAt: null },
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

  // Review methods
  async createReview(
    productId: string,
    userId: string,
    rating: number,
    comment: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const user = await this.supabaseService.getUserById(userId);

    const review = this.reviewRepository.create({
      productId,
      userId,
      userName: user?.name || user?.email || 'Anonymous',
      userAvatar: user?.avatar_url,
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
      where: { productId, deletedAt: null },
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
}
