import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OAuthLoginDto } from './dto/oauth-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/oauth
   * Get OAuth URL để redirect user tới provider (Google, Facebook, Github)
   *
   * Request Body:
   * {
   *   "provider": "google" | "facebook" | "github",
   *   "redirectTo": "http://localhost:3000/auth/callback" (optional)
   * }
   *
   * Response:
   * {
   *   "url": "https://accounts.google.com/...",
   *   "provider": "google"
   * }
   */
  @Public()
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  async loginOAuth(@Body() oauthDto: OAuthLoginDto) {
    return {
      data: await this.authService.loginOAuth(
        oauthDto.provider,
        oauthDto.redirectTo,
      ),
    };
  }

  /**
   * POST /auth/register
   * Đăng ký tài khoản mới với email & password
   *
   * Request Body:
   * {
   *   "email": "user@example.com",
   *   "password": "password123",
   *   "name": "John Doe"
   * }
   *
   * Response:
   * {
   *   "user": { "id", "email", "name", "avatarUrl" },
   *   "session": { "access_token", "refresh_token", "expires_in", "expires_at" }
   * }
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return {
      data: await this.authService.register(registerDto),
    };
  }

  /**
   * POST /auth/login
   * Đăng nhập với email & password
   *
   * Request Body:
   * {
   *   "email": "user@example.com",
   *   "password": "password123"
   * }
   *
   * Response:
   * {
   *   "user": { "id", "email", "name", "avatarUrl" },
   *   "session": { "access_token", "refresh_token", "expires_in", "expires_at" }
   * }
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return {
      data: await this.authService.login(loginDto),
    };
  }

  /**
   * POST /auth/refresh
   * Làm mới access token bằng refresh token
   *
   * Request Body:
   * {
   *   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * Response:
   * {
   *   "session": { "access_token", "refresh_token", "expires_in", "expires_at" }
   * }
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refresh_token') refreshToken: string) {
    return {
      data: await this.authService.refreshToken(refreshToken),
    };
  }

  /**
   * GET /auth/verify
   * Xác thực token hiện tại
   * Requires: Authorization header with Bearer token
   *
   * Response:
   * {
   *   "user": { "id", "email", "name", "avatarUrl" }
   * }
   */
  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: any) {
    return {
      data: req.user,
    };
  }

  /**
   * POST /auth/logout
   * Đăng xuất user
   * Requires: Authorization header with Bearer token
   *
   * Response:
   * {
   *   "message": "Logged out successfully"
   * }
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const token = req.headers.authorization?.split(' ')[1];
    return {
      data: await this.authService.logout(token),
    };
  }

  /**
   * POST /auth/callback/exchange
   * Exchange Supabase OAuth tokens for formatted user data
   * Frontend nhận tokens từ Supabase callback và gửi lên backend để validate và format
   *
   * Request Body:
   * {
   *   "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6ImlFYmx...",
   *   "refresh_token": "...",
   *   "expires_in": 3600,
   *   "expires_at": 1762784131,
   *   "provider_token": "...",
   *   "token_type": "bearer"
   * }
   *
   * Response:
   * {
   *   "data": {
   *     "user": { "id", "email", "name", "avatarUrl" },
   *     "session": { "access_token", "refresh_token", "expires_in", "expires_at" }
   *   }
   * }
   */
  @Public()
  @Post('callback/exchange')
  @HttpCode(HttpStatus.OK)
  async exchangeOAuthTokens(@Body() tokens: any) {
    return {
      data: await this.authService.exchangeOAuthTokens(tokens),
    };
  }
}
