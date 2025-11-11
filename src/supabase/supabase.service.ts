import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async getOAuthURL(provider: string, redirectTo: string): Promise<string> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo,
      },
    });
    if (error) {
      throw error;
    }
    return data.url;
  }

  async getUserById(userId: string): Promise<any> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error) {
      throw error;
    }

    return data?.user;
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.getUserById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      avatar_url:
        user.user_metadata?.avatar_url || '/images/default_avatar.jpg',
      bio: user.user_metadata?.bio,
      phone: user.phone || user.user_metadata?.phone,
    };
  }

  async getUsersByIds(userIds: string[]): Promise<Map<string, any>> {
    const userMap = new Map<string, any>();

    // Supabase không có batch get users, nên phải gọi từng cái
    // Trong production, nên cache lại để tối ưu performance
    const promises = userIds.map((id) =>
      this.getUserById(id).catch(() => null),
    );
    const users = await Promise.all(promises);

    users.forEach((user, index) => {
      if (user) {
        userMap.set(userIds[index], user);
      }
    });

    return userMap;
  }

  async checkIfFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const { data } = await this.supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    return !!data;
  }
}
