import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

/**
 * CSRF Protection Service
 *
 * Implements double-submit cookie pattern for CSRF protection.
 * Works with GraphQL mutations that change server state.
 *
 * Pattern:
 * 1. Server generates a random CSRF token and stores it in a cookie (SameSite=Strict)
 * 2. Client must read the token and include it in request headers (X-CSRF-Token)
 * 3. Server validates that the cookie token matches the header token
 *
 * Security features:
 * - Uses cryptographically secure random token generation
 * - HMAC-based token signing to prevent token forgery
 * - Timing-safe comparison to prevent timing attacks
 * - SameSite=Strict cookie to prevent cross-origin requests
 */
@Injectable()
export class CsrfService {
  private readonly tokenLength = 32;
  private readonly secret: string;

  constructor(private readonly configService: ConfigService) {
    // Use JWT secret or dedicated CSRF secret
    this.secret =
      this.configService.get<string>('CSRF_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'csrf-fallback-secret-change-in-production';
  }

  /**
   * Generate a new CSRF token
   * Returns an object with the raw token and signed token
   */
  generateToken(): { token: string; signedToken: string } {
    const token = randomBytes(this.tokenLength).toString('hex');
    const signedToken = this.signToken(token);
    return { token, signedToken };
  }

  /**
   * Sign a token using HMAC-SHA256
   */
  private signToken(token: string): string {
    const hmac = createHmac('sha256', this.secret);
    hmac.update(token);
    return `${token}.${hmac.digest('hex')}`;
  }

  /**
   * Validate a CSRF token
   * Compares the header token against the cookie token using timing-safe comparison
   *
   * @param cookieToken - Token from the cookie (signed)
   * @param headerToken - Token from the X-CSRF-Token header
   * @returns true if valid, false otherwise
   */
  validateToken(cookieToken: string, headerToken: string): boolean {
    if (!cookieToken || !headerToken) {
      return false;
    }

    try {
      // Parse the signed cookie token
      const [rawToken, signature] = cookieToken.split('.');
      if (!rawToken || !signature) {
        return false;
      }

      // Verify the signature
      const hmac = createHmac('sha256', this.secret);
      hmac.update(rawToken);
      const expectedSignature = hmac.digest('hex');

      // Timing-safe comparison for signature
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return false;
      }

      // Timing-safe comparison for header token vs raw token
      const headerBuffer = Buffer.from(headerToken, 'utf8');
      const rawBuffer = Buffer.from(rawToken, 'utf8');

      if (headerBuffer.length !== rawBuffer.length) {
        return false;
      }

      return timingSafeEqual(headerBuffer, rawBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Get cookie options for the CSRF token
   * Uses SameSite=Strict for maximum protection
   */
  getCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    path: string;
    maxAge: number;
  } {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    return {
      httpOnly: false, // Must be readable by JavaScript for double-submit pattern
      secure: isProduction, // HTTPS only in production
      // Use 'lax' in development for cross-origin cookie handling (different ports)
      // Use 'strict' in production for maximum security (same-origin)
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
  }

  /**
   * Cookie name for CSRF token
   */
  getCookieName(): string {
    return 'csrf-token';
  }

  /**
   * Header name for CSRF token
   */
  getHeaderName(): string {
    return 'x-csrf-token';
  }
}
