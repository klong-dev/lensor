import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';
import { Order } from '../orders/entities/order.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { SystemVariablesService } from '../system-variables/system-variables.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private jwtService: JwtService,
    private systemVariablesService: SystemVariablesService,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto) {
    // Check if username already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { username: createAdminDto.username },
    });

    if (existingAdmin) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    // Create admin
    const admin = this.adminRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });

    const savedAdmin = await this.adminRepository.save(admin);

    // Remove password from response
    const { password, ...result } = savedAdmin;
    return result;
  }

  async login(adminLoginDto: AdminLoginDto) {
    const { username, password } = adminLoginDto;

    // Find admin by username
    const admin = await this.adminRepository.findOne({
      where: { username, isActive: true },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generate JWT token with admin role
    const payload = {
      sub: admin.id,
      username: admin.username,
      role: admin.role,
      type: 'admin',
    };

    const access_token = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

    const { password: _, ...adminData } = admin;

    return {
      admin: adminData,
      session: {
        access_token,
        refresh_token,
        expires_in: 28800, // 8 hours
      },
    };
  }

  async validateAdmin(adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId, isActive: true },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    const { password, ...result } = admin;
    return result;
  }

  async findById(adminId: string) {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new BadRequestException('Admin not found');
    }

    const { password, ...result } = admin;
    return result;
  }

  async getAllAdmins() {
    const admins = await this.adminRepository.find({
      select: [
        'id',
        'username',
        'email',
        'name',
        'role',
        'isActive',
        'createdAt',
      ],
    });
    return admins;
  }

  async deactivateAdmin(adminId: string) {
    await this.adminRepository.update(adminId, { isActive: false });
    return { message: 'Admin deactivated successfully' };
  }

  async getRevenueStatistics() {
    // Lấy tất cả orders có status = 'withdrawn' (đã rút tiền)
    const withdrawnOrders = await this.orderRepository.find({
      where: { status: 'withdrawn' },
      select: ['id', 'totalAmount', 'createdAt', 'items'],
    });

    // Lấy discount-rate từ system variables
    const discountRate =
      (await this.systemVariablesService.getVariable('discountRate')) / 100;
    const sellerRate = 1 - discountRate;

    if (withdrawnOrders.length === 0) {
      return {
        totalOrders: 0,
        totalOrderValue: 0,
        platformRevenue: 0,
        platformRevenuePercentage: Math.round(discountRate * 100),
        sellerRevenue: 0,
        sellerRevenuePercentage: Math.round(sellerRate * 100),
        formattedPlatformRevenue: '0 VNĐ',
        formattedSellerRevenue: '0 VNĐ',
        formattedTotalOrderValue: '0 VNĐ',
      };
    }

    // Tính tổng giá trị các orders
    const totalOrderValue = withdrawnOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    // Tính doanh thu platform (discountRate)
    const platformRevenue = totalOrderValue * discountRate;

    // Tính phần seller nhận được (1 - discountRate)
    const sellerRevenue = totalOrderValue * sellerRate;

    // Format số tiền theo VND
    const formatVND = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    return {
      totalOrders: withdrawnOrders.length,
      totalOrderValue: Math.round(totalOrderValue),
      platformRevenue: Math.round(platformRevenue),
      platformRevenuePercentage: Math.round(discountRate * 100),
      sellerRevenue: Math.round(sellerRevenue),
      sellerRevenuePercentage: Math.round(sellerRate * 100),
      formattedPlatformRevenue: formatVND(platformRevenue),
      formattedSellerRevenue: formatVND(sellerRevenue),
      formattedTotalOrderValue: formatVND(totalOrderValue),
      orders: withdrawnOrders.map((order) => ({
        id: order.id,
        totalAmount: Number(order.totalAmount),
        platformFee: Math.round(Number(order.totalAmount) * discountRate),
        sellerReceived: Math.round(Number(order.totalAmount) * sellerRate),
        createdAt: order.createdAt,
        itemCount: order.items?.length || 0,
      })),
    };
  }
}
