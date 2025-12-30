import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface UserPayload {
  userId: number;
  username: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  validateUser(username: string, pass: string): UserPayload | null {
    // TODO: Connect to real User Service (T012)
    // For now, simple mock
    if (username === 'admin' && pass === 'password') {
      const result = { userId: 1, username: 'admin', roles: ['admin'] };
      return result;
    }
    return null;
  }

  login(user: UserPayload): LoginResponse {
    const payload = {
      username: user.username,
      sub: user.userId,
      roles: user.roles,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
