import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CsrfService } from './csrf.service';

/**
 * CSRF Token Controller
 *
 * Provides an endpoint for clients to obtain a CSRF token.
 * The token is returned both in the response body and as a cookie.
 *
 * Workflow:
 * 1. Client calls GET /api/csrf-token on page load
 * 2. Server generates a token, sets it as a cookie, and returns the raw token
 * 3. Client stores the raw token and includes it in X-CSRF-Token header for mutations
 * 4. Server validates that header token matches cookie token
 */
@Controller('api')
export class CsrfController {
  constructor(private readonly csrfService: CsrfService) {}

  /**
   * GET /api/csrf-token
   *
   * Generate and return a new CSRF token.
   * Sets the signed token as a cookie and returns the raw token in the response.
   *
   * @returns Object containing the CSRF token for client-side storage
   */
  @Get('csrf-token')
  getCsrfToken(@Res({ passthrough: true }) response: Response): { token: string } {
    const { token, signedToken } = this.csrfService.generateToken();

    // Set the signed token as a cookie
    const cookieName = this.csrfService.getCookieName();
    const cookieOptions = this.csrfService.getCookieOptions();

    response.cookie(cookieName, signedToken, cookieOptions);

    // Return the raw token for the client to include in headers
    return { token };
  }
}
