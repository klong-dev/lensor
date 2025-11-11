import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from 'src/supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  /**
   * OAuth Login - Get OAuth URL
   * Frontend sẽ redirect user tới URL này để login
   */
  async loginOAuth(provider: string, redirectTo?: string) {
    const supabase = this.supabaseService.getClient();

    // Redirect về frontend callback để frontend xử lý tokens
    const redirectUrl =
      redirectTo ||
      this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000') +
        '/auth/callback';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      url: data.url,
      provider,
    };
  }

  /**
   * Register with Email & Password
   * Tạo user mới với email và password
   */
  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getClient();
    const { email, password, name } = registerDto;

    // Kiểm tra email đã tồn tại chưa
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users.some(
      (user: any) => user.email === email,
    );

    if (emailExists) {
      throw new BadRequestException('Email already exists');
    }

    // Tạo user mới với Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto confirm email
      user_metadata: {
        name,
        avatar_url: '/images/default_avatar.jpg',
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    // Tạo session cho user
    const { data: sessionData, error: sessionError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (sessionError) {
      throw new UnauthorizedException(sessionError.message);
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        avatarUrl:
          data.user.user_metadata?.avatar_url || '/images/default_avatar.jpg',
      },
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
      },
    };
  }

  /**
   * Login with Email & Password
   * Đăng nhập bằng email và password
   */
  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();
    const { email, password } = loginDto;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        avatarUrl:
          data.user.user_metadata?.avatar_url || '/images/default_avatar.jpg',
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
    };
  }

  /**
   * Refresh Token
   * Làm mới access token khi hết hạn
   */
  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
      },
    };
  }

  /**
   * Verify Token
   * Xác thực JWT token từ Supabase
   */
  async verifyToken(token: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
        avatarUrl:
          data.user.user_metadata?.avatar_url || '/images/default_avatar.jpg',
      },
    };
  }

  /**
   * Logout
   * Đăng xuất user
   */
  async logout(token: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.auth.admin.signOut(token);

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Exchange OAuth Tokens
   * Nhận tokens từ Supabase OAuth callback và format lại response
   * để trả về cho frontend theo format chuẩn
   */
  async exchangeOAuthTokens(tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
    provider_token?: string;
    token_type: string;
  }) {
    const supabase = this.supabaseService.getClient();

    try {
      // Get user info từ access token
      const { data: userData, error: userError } = await supabase.auth.getUser(
        tokens.access_token,
      );

      if (userError) {
        throw new UnauthorizedException('Invalid OAuth token');
      }

      // Format response giống như login/register
      return {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          name:
            userData.user.user_metadata?.name ||
            userData.user.user_metadata?.full_name ||
            userData.user.email?.split('@')[0],
          avatarUrl:
            userData.user.user_metadata?.avatar_url ||
            userData.user.user_metadata?.picture ||
            '/images/default_avatar.jpg',
        },
        session: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          expires_at: tokens.expires_at,
        },
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Failed to exchange OAuth tokens: ' + error.message,
      );
    }
  }
}
