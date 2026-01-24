import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT payload structure for authentication tokens
 */
interface JwtPayload {
  sub: string; // User UUID
  username: string;
  email: string;
  roles: string[];
  type?: 'access' | 'refresh';
}

/**
 * User data extracted from validated JWT token
 * Available in request.user after authentication
 */
export interface ValidatedUser {
  id: string; // User UUID
  username: string;
  email: string;
  roles: string[];
}

/**
 * JWT Strategy for Passport authentication
 *
 * Validates JWT tokens from Authorization header
 * and extracts user information for the request context.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey',
    });
  }

  /**
   * Validate and transform JWT payload to user object
   * Called automatically by Passport after token verification
   */
  validate(payload: JwtPayload): ValidatedUser {
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles || ['user'],
    };
  }
}
