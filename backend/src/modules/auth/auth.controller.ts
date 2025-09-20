import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, AuthResponseDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/current-user.decorator';

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký thành công', 
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu đầu vào không hợp lệ (email, mật khẩu, tên, vai trò)' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email đã được sử dụng' 
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công', 
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu đầu vào không hợp lệ (email, mật khẩu)' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Thông tin đăng nhập không đúng (email không tồn tại, mật khẩu sai, tài khoản chưa kích hoạt)' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Tài khoản bị khóa hoặc chưa được xác thực' 
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới access token' })
  @ApiResponse({ 
    status: 200, 
    description: 'Token được làm mới thành công' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Refresh token không được cung cấp' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Refresh token không hợp lệ hoặc đã hết hạn' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Tài khoản bị khóa hoặc chưa được kích hoạt' 
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu (đăng nhập yêu cầu)' })
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu (gửi email)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
