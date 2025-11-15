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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private jwtService: JwtService,
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

    if (withdrawnOrders.length === 0) {
      return {
        totalOrders: 0,
        totalOrderValue: 0,
        platformRevenue: 0, // 17% của tổng
        platformRevenuePercentage: 17,
        sellerRevenue: 0, // 83% còn lại
        sellerRevenuePercentage: 83,
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

    // Tính doanh thu platform (17%)
    const platformRevenue = totalOrderValue * 0.17;

    // Tính phần seller nhận được (83%)
    const sellerRevenue = totalOrderValue * 0.83;

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
      platformRevenue: Math.round(platformRevenue), // 17%
      platformRevenuePercentage: 17,
      sellerRevenue: Math.round(sellerRevenue), // 83%
      sellerRevenuePercentage: 83,
      formattedPlatformRevenue: formatVND(platformRevenue),
      formattedSellerRevenue: formatVND(sellerRevenue),
      formattedTotalOrderValue: formatVND(totalOrderValue),
      orders: withdrawnOrders.map((order) => ({
        id: order.id,
        totalAmount: Number(order.totalAmount),
        platformFee: Math.round(Number(order.totalAmount) * 0.17),
        sellerReceived: Math.round(Number(order.totalAmount) * 0.83),
        createdAt: order.createdAt,
        itemCount: order.items?.length || 0,
      })),
    };
  }
}
