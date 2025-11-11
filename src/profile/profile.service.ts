import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../posts/entities/post.entity';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    private supabaseService: SupabaseService,
  ) {}

  async getStats(userId: string): Promise<{
    follower: number;
    following: number;
    totalPost: number;
  }> {
    // Get follower count from Supabase
    const { data: followers, error: followersError } =
      await this.supabaseService
        .getClient()
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    // Get following count from Supabase
    const { data: following, error: followingError } =
      await this.supabaseService
        .getClient()
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    // Get total posts count
    const totalPost = await this.postRepository.count({
      where: { userId: userId },
    });

    return {
      follower: followersError ? 0 : (followers as any)?.length || 0,
      following: followingError ? 0 : (following as any)?.length || 0,
      totalPost,
    };
  }

  async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    follower: any[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { data, error, count } = await this.supabaseService
      .getClient()
      .from('followers')
      .select(
        `
        follower_id,
        created_at,
        follower:profiles!followers_follower_id_fkey(id, username, avatar_url, full_name)
      `,
        { count: 'exact' },
      )
      .eq('following_id', userId)
      .range(offset, offset + limit - 1);

    if (error) {
      return { follower: [], meta: { total: 0, limit, offset } };
    }

    return {
      follower: data || [],
      meta: { total: count || 0, limit, offset },
    };
  }

  async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    following: any[];
    meta: { total: number; limit: number; offset: number };
  }> {
    const { data, error, count } = await this.supabaseService
      .getClient()
      .from('followers')
      .select(
        `
        following_id,
        created_at,
        following:profiles!followers_following_id_fkey(id, username, avatar_url, full_name)
      `,
        { count: 'exact' },
      )
      .eq('follower_id', userId)
      .range(offset, offset + limit - 1);

    if (error) {
      return { following: [], meta: { total: 0, limit, offset } };
    }

    return {
      following: data || [],
      meta: { total: count || 0, limit, offset },
    };
  }

  async follow(followerId: string, followingId: string): Promise<any> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('followers')
      .insert([{ follower_id: followerId, following_id: followingId }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const { error } = await this.supabaseService
      .getClient()
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    return !error && !!data;
  }
}
