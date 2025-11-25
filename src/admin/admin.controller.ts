import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SystemVariablesService } from '../system-variables/system-variables.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemVariablesService: SystemVariablesService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() adminLoginDto: AdminLoginDto) {
    return await this.adminService.login(adminLoginDto);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    const admin = await this.adminService.createAdmin(createAdminDto);
    return {
      data: admin,
      message: 'Admin created successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getProfile(@CurrentUser() user: { userId: string }) {
    const admin = await this.adminService.findById(user.userId);
    return { data: admin };
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllAdmins() {
    const admins = await this.adminService.getAllAdmins();
    return { data: admins };
  }

  @Get('revenue/statistics')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getRevenueStatistics() {
    const statistics = await this.adminService.getRevenueStatistics();
    return { data: statistics };
  }

  @Post('discount-rate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setDiscountRate(@Body() body: { value: number }) {
    const updated = await this.systemVariablesService.setVariable(
      'discountRate',
      body.value,
    );
    return { discountRate: updated.value };
  }
}
