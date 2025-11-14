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
import { AdminLoginDto } from './dto/admin-login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
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
}
