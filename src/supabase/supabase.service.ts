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

  async getUserById(userId: string): Promise<any> {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error) {
      throw error;
    }

    return data?.user;
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

  async getUserProfile(userId: string): Promise<any> {
    // Lấy thông tin từ bảng profiles trong Supabase
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  async getUserProfiles(userIds: string[]): Promise<Map<string, any>> {
    const { data, error } = await this.supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching user profiles:', error);
      return new Map();
    }

    const userMap = new Map<string, any>();
    const users = (data?.users ?? []) as Array<{
      id: string;
      [key: string]: any;
    }>;
    users.forEach((user) => {
      userMap.set(user.id, user);
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
