import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { UserFollowsService } from '../user-follows/user-follows.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private supabaseService: SupabaseService,
    private userFollowsService: UserFollowsService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    const post = this.postRepository.create({
      ...createPostDto,
      userId,
    });

    return this.postRepository.save(post);
  }

  async findAll(currentUserId?: string) {
    const posts = await this.postRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      relations: ['votes'],
    });

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        const post_owner = await this.supabaseService.getUserById(post.userId);

        // Check if current user is following post author
        let isFollowed = false;
        if (currentUserId && post.userId !== currentUserId) {
          isFollowed = await this.userFollowsService.isFollowing(
            currentUserId,
            post.userId,
          );
        }

        // Calculate vote count
        const voteCount =
          post.votes?.reduce((sum, vote) => sum + vote.value, 0) || 0;

        return {
          id: post.id,
          user: {
            id: post_owner.id,
            name: post_owner.name || post_owner.email || 'Unknown User',
            avatarUrl: post_owner.avatar_url || '/images/default_avatar.jpg',
            isFollowed,
          },
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          voteCount,
          commentCount: 0, // TODO: Implement when comment feature is added
          createdAt: this.formatDate(post.createdAt),
        };
      }),
    );

    return formattedPosts;
  }

  async findOne(id: string, currentUserId?: string) {
    const post = await this.postRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['votes'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    const userProfile = await this.supabaseService.getUserProfile(post.userId);

    let isFollowed = false;
    if (currentUserId && post.userId !== currentUserId) {
      isFollowed = await this.userFollowsService.isFollowing(
        currentUserId,
        post.userId,
      );
    }

    const voteCount =
      post.votes?.reduce((sum, vote) => sum + vote.value, 0) || 0;

    return {
      id: post.id,
      user: {
        id: post.userId,
        name: userProfile?.name || userProfile?.email || 'Unknown User',
        avatarUrl: userProfile?.avatar_url || '/images/default_avatar.jpg',
        isFollowed,
      },
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      voteCount,
      commentCount: 0,
      createdAt: this.formatDate(post.createdAt),
    };
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${id} not found or you don't have permission`,
      );
    }

    Object.assign(post, updatePostDto);
    return this.postRepository.save(post);
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException(
        `Post with ID ${id} not found or you don't have permission`,
      );
    }

    post.deletedAt = new Date();
    await this.postRepository.save(post);
  }

  private formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
}
