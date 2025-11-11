import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user info
   * GET /users/me
   */
  @Get('me')
  async getMe(@CurrentUser() user: { userId: string }) {
    const userData = await this.usersService.getMe(user.userId);
    return { data: userData };
  }

  /**
   * Update current user
   * PUT /users/me
   */
  @Put('me')
  async updateMe(
    @CurrentUser() user: { userId: string },
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.update(
      user.userId,
      updateUserDto,
    );
    return { data: updatedUser };
  }

  /**
   * Get all users with pagination
   * GET /users?page=1&limit=50
   */
  @Get()
  @Public()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    const result = await this.usersService.findAll(page, limit);
    return { data: result };
  }

  /**
   * Search users by email or name
   * GET /users/search?q=john
   */
  @Get('search')
  @Public()
  async search(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query) {
      return { data: [] };
    }
    const users = await this.usersService.search(query, limit);
    return { data: users };
  }

  /**
   * Get user by ID
   * GET /users/:id
   */
  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { data: user };
  }

  /**
   * Get user statistics
   * GET /users/:id/stats
   */
  @Get(':id/stats')
  @Public()
  async getUserStats(@Param('id') id: string) {
    const stats = await this.usersService.getUserStats(id);
    return { data: stats };
  }

  /**
   * Update user by ID (admin only - add admin guard if needed)
   * PUT /users/:id
   */
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return { data: updatedUser };
  }

  /**
   * Delete user by ID (admin only - add admin guard if needed)
   * DELETE /users/:id
   */
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { data: { message: 'User deleted successfully' } };
  }
}
