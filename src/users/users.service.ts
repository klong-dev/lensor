import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { SupabaseService } from '../supabase/supabase.service';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Post } from '../posts/entities/post.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get user by ID from Supabase Auth with posts and products
   */
  async findById(userId: string): Promise<any> {
    try {
      const supabase = this.supabaseService.getClient();
      const { data, error } = await supabase.auth.admin.getUserById(userId);

      if (error || !data.user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get user's posts
      const posts = await this.postRepository.find({
        where: { userId, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 10, // Limit to 10 recent posts
      });

      // Get user's products
      const products = await this.productRepository.find({
        where: { userId, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 10, // Limit to 10 recent products
      });

      const userDto = this.mapToUserDto(data.user);

      return {
        ...userDto,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          thumbnailUrl: post.thumbnailUrl,
          isNSFW: post.isNSFW,
          createdAt: post.createdAt,
        })),
        products: products.map((product) => ({
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          thumbnail: product.thumbnail,
          rating: product.rating,
          reviewCount: product.reviewCount,
          sellCount: product.sellCount,
          createdAt: product.createdAt,
        })),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  /**
   * Get all users (with pagination)
   */
  async findAll(
    page = 1,
    limit = 50,
  ): Promise<{
    users: UserDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get users with pagination
      const perPage = Math.min(limit, 1000); // Supabase max is 1000
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throw error;
      }

      const users = data.users.map((user) => this.mapToUserDto(user));

      return {
        users,
        total: data.users.length, // Note: Supabase doesn't return total count
        page,
        limit: perPage,
      };
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Get multiple users by IDs
   */
  async findByIds(userIds: string[]): Promise<UserDto[]> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const promises = userIds.map((id) => this.findById(id).catch(() => null));
    const users = await Promise.all(promises);

    return users.filter((user): user is UserDto => user !== null);
  }

  /**
   * Get current user info (me)
   */
  async getMe(userId: string): Promise<UserDto> {
    return this.findById(userId);
  }

  /**
   * Update user metadata
   * Note: This updates user_metadata in Supabase Auth
   */
  async update(userId: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    try {
      const supabase = this.supabaseService.getClient();

      // Update user metadata
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: updateUserDto.name,
          bio: updateUserDto.bio,
          avatar_url: updateUserDto.avatarUrl,
          phone: updateUserDto.phone,
        },
        email: updateUserDto.email,
      });

      if (error || !data.user) {
        throw new Error(`Failed to update user: ${error?.message}`);
      }

      return this.mapToUserDto(data.user);
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user (hard delete from Supabase Auth)
   */
  async delete(userId: string): Promise<void> {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Search users by email or name
   */
  async search(query: string, limit = 20): Promise<UserDto[]> {
    try {
      const supabase = this.supabaseService.getClient();

      // Get all users (Supabase doesn't support search in Auth API)
      // In production, consider implementing a users table with search
      const { data, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Get more users for searching
      });

      if (error) {
        throw error;
      }

      // Filter users by query
      const searchQuery = query.toLowerCase();
      const filteredUsers = data.users
        .filter((user: any) => {
          const email = user.email?.toLowerCase() || '';
          const name = user.user_metadata?.name?.toLowerCase() || '';
          return email.includes(searchQuery) || name.includes(searchQuery);
        })
        .slice(0, limit);

      return filteredUsers.map((user: any) => this.mapToUserDto(user));
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
  }> {
    // This would require querying your database tables
    // Placeholder implementation
    return {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    };
  }

  /**
   * Map Supabase user to UserDto
   */
  private mapToUserDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url || '/images/default_avatar.jpg',
      bio: user.user_metadata?.bio,
      phone: user.phone || user.user_metadata?.phone,
      createdAt: new Date(user.created_at),
      updatedAt: user.updated_at ? new Date(user.updated_at) : undefined,
      emailConfirmedAt: user.email_confirmed_at
        ? new Date(user.email_confirmed_at)
        : undefined,
      lastSignInAt: user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : undefined,
    };
  }
}
