import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint - validates credentials and returns JWT token
   * Uses bcrypt for secure password comparison against stored hash
   * Rate limited to prevent brute force attacks
   */
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  /**
   * Register endpoint - creates a new user with hashed password
   * Rate limited to prevent spam registration
   */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register({
      email: registerDto.email,
      username: registerDto.username,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: registerDto.password,
    });

    return {
      message: 'User registered successfully',
      userId: user.id,
      email: user.email,
    };
  }
}
