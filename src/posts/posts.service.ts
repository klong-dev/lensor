import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post } from './entities/post.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { UserFollowsService } from '../user-follows/user-follows.service';
import { PostLikesService } from '../post-likes/post-likes.service';
import { PostCommentsService } from '../post-comments/post-comments.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private supabaseService: SupabaseService,
    private userFollowsService: UserFollowsService,
    private postLikesService: PostLikesService,
    private postCommentsService: PostCommentsService,
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
    });

    const formattedPosts = await Promise.all(
      posts.map(async (post) => {
        let post_owner;
        try {
          post_owner = await this.supabaseService.getUserById(post.userId);
        } catch {
          // User not found (deleted account), return deleted user placeholder
          post_owner = null;
        }

        // Check if current user is following post author
        let isFollowed = false;
        if (currentUserId && post.userId !== currentUserId && post_owner) {
          isFollowed = await this.userFollowsService.isFollowing(
            currentUserId,
            post.userId,
          );
        }

        // Calculate vote count from post likes
        const voteCount = await this.postLikesService.getPostLikeCount(post.id);

        // Calculate comment count
        const commentCount = await this.postCommentsService.getCommentCount(
          post.id,
        );

        // Check if current user liked this post
        let isLiked = false;
        if (currentUserId) {
          isLiked = await this.postLikesService.isPostLikedByUser(
            post.id,
            currentUserId,
          );
        }

        return {
          id: post.id,
          user: {
            id: post_owner?.id || post.userId,
            name: post_owner
              ? post_owner.user_metadata.name ||
                post_owner.email ||
                'Unknown User'
              : 'Deleted User',
            avatarUrl: post_owner
              ? post_owner.user_metadata.picture ||
                post_owner.user_metadata.avatar_url ||
                '/images/default_avatar.jpg'
              : '/images/deleted_user.jpg',
            isFollowed,
          },
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          thumbnailUrl: post.thumbnailUrl,
          imageMetadata: post.imageMetadata || null,
          voteCount,
          isLiked,
          commentCount,
          createdAt: this.formatDate(post.createdAt),
        };
      }),
    );

    return formattedPosts;
  }

  async findOne(id: string, currentUserId?: string) {
    const post = await this.postRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    let userProfile;
    try {
      userProfile = await this.supabaseService.getUserProfile(post.userId);
    } catch {
      // User not found (deleted account)
      userProfile = null;
    }

    let isFollowed = false;
    if (currentUserId && post.userId !== currentUserId && userProfile) {
      isFollowed = await this.userFollowsService.isFollowing(
        currentUserId,
        post.userId,
      );
    }

    // Calculate vote count from post likes
    const voteCount = await this.postLikesService.getPostLikeCount(post.id);

    // Calculate comment count
    const commentCount = await this.postCommentsService.getCommentCount(
      post.id,
    );

    // Check if current user liked this post
    let isLiked = false;
    if (currentUserId) {
      isLiked = await this.postLikesService.isPostLikedByUser(
        post.id,
        currentUserId,
      );
    }

    return {
      id: post.id,
      user: {
        id: post.userId,
        name: userProfile?.name || userProfile?.email || 'Deleted User',
        avatarUrl: userProfile?.avatar_url || '/images/deleted_user.jpg',
        isFollowed,
      },
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      thumbnailUrl: post.thumbnailUrl,
      imageMetadata: post.imageMetadata || null,
      voteCount,
      isLiked,
      commentCount,
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
