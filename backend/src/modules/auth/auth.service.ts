import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../models/user.model';
import { RegisterDto, LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name, role = 'student' } = registerDto;

    // Validate input
    if (!email || !email.trim()) {
      throw new BadRequestException('Email không được để trống');
    }

    if (!password || password.length < 8) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 8 ký tự');
    }

    if (!name || name.trim().length < 2) {
      throw new BadRequestException('Tên phải có ít nhất 2 ký tự');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email không đúng định dạng');
    }

    // Check if user exists
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException(`Email ${email} đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.`);
    }

    // Validate role
    const validRoles = ['admin', 'teacher', 'student', 'parent', 'guest'];
    if (!validRoles.includes(role)) {
      throw new BadRequestException(`Vai trò không hợp lệ. Vai trò hợp lệ: ${validRoles.join(', ')}`);
    }

    try {
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = new this.userModel({
        email: email.toLowerCase(),
        passwordHash,
        name: name.trim(),
        role,
        verified: false, // TODO: Implement email verification
      });

      await user.save();

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(`Email ${email} đã được sử dụng. Vui lòng chọn email khác.`);
      }
      throw new BadRequestException('Không thể tạo tài khoản. Vui lòng thử lại sau.');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validate input
    if (!email || !email.trim()) {
      throw new BadRequestException('Email không được để trống');
    }

    if (!password || !password.trim()) {
      throw new BadRequestException('Mật khẩu không được để trống');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Email không đúng định dạng');
    }

    try {
      // Find user
      const user = await this.userModel.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new UnauthorizedException(`Không tìm thấy tài khoản với email ${email}. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới.`);
      }

      // Check if user has password (for users created without password)
      if (!user.passwordHash) {
        throw new UnauthorizedException('Tài khoản này chưa được thiết lập mật khẩu. Vui lòng liên hệ quản trị viên.');
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Mật khẩu không đúng. Vui lòng kiểm tra lại mật khẩu hoặc sử dụng chức năng quên mật khẩu.');
      }

      // Check if user is verified (optional - can be enabled later)
      // if (!user.verified) {
      //   throw new ForbiddenException('Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.');
      // }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error: any) {
      // Re-throw known exceptions
      if (error instanceof UnauthorizedException || error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      // Handle unexpected errors
      throw new BadRequestException('Đăng nhập thất bại. Vui lòng thử lại sau.');
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken || !refreshToken.trim()) {
      throw new BadRequestException('Refresh token không được để trống');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_SECRET || 'change_me_refresh',
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị xóa. Vui lòng đăng nhập lại.');
      }

      // Check if user is still active
      if (!user.verified && user.role !== 'admin') {
        throw new ForbiddenException('Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Refresh token không hợp lệ. Vui lòng đăng nhập lại.');
      } else if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Không thể làm mới token. Vui lòng đăng nhập lại.');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 8 ký tự');
    }
    const user = await this.userModel.findById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Tài khoản không hợp lệ');
    }
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { message: 'Đổi mật khẩu thành công' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email?.toLowerCase();
    if (!email) throw new BadRequestException('Email không được để trống');
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // Do not reveal existence
      return { message: 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu' };
    }
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires as any;
    await user.save();
    // TODO: integrate email service; for now, return token for testing
    return { message: 'Đã tạo yêu cầu đặt lại mật khẩu', token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;
    if (!token || !newPassword || newPassword.length < 8) {
      throw new BadRequestException('Dữ liệu không hợp lệ');
    }
    const user = await this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() as any },
    });
    if (!user) {
      throw new UnauthorizedException('Token đặt lại không hợp lệ hoặc đã hết hạn');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined as any;
    user.resetPasswordExpires = undefined as any;
    await user.save();
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async generateTokens(user: UserDocument) {
    const payload = { email: user.email, sub: user._id, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET || 'change_me_refresh',
      expiresIn: process.env.REFRESH_EXPIRES || '7d',
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: UserDocument) {
    const { passwordHash, ...sanitized } = user.toObject();
    return sanitized;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (user && await bcrypt.compare(password, user.passwordHash || '')) {
      return this.sanitizeUser(user);
    }
    return null;
  }
}
