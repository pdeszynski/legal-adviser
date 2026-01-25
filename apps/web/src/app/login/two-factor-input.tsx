'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Button,
} from '@legal/ui';
import { Shield, AlertCircle } from 'lucide-react';
import { useStoredRedirect } from '@/lib/auth-guard';

interface TwoFactorInputProps {
  email: string;
  password: string;
  onCancel: () => void;
}

/**
 * Two-Factor Authentication Input Component
 *
 * Displays when login requires 2FA verification.
 * Features:
 * - 6-digit TOTP input with auto-spacing
 * - Backup code input alternative
 * - Countdown timer for token expiry
 * - Cancel button to return to login
 */
export const TwoFactorInput = ({ email, password, onCancel }: TwoFactorInputProps) => {
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const { getRedirectUrl } = useStoredRedirect();

  // Ref to store temporary token from initial login response
  const tempTokenRef = useRef<string | null>(null);

  // Countdown timer for TOTP expiry
  useEffect(() => {
    if (timeRemaining <= 0) {
      setTimeRemaining(30);
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Format the 6-digit code with spaces (XXX XXX)
  const formatCode = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 3) {
      return digits;
    }
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }, []);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCode(e.target.value);
      setCode(formatted);
      setError(null);
    },
    [formatCode],
  );

  const handleBackupCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBackupCode(e.target.value.toUpperCase().slice(0, 8));
    setError(null);
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

      let mutation: string;
      let variables: Record<string, unknown>;

      if (showBackupCode) {
        // Submit with backup code
        if (!backupCode || backupCode.length < 8) {
          setError('Please enter a valid 8-character backup code');
          setIsLoading(false);
          return;
        }

        // If we have a temp token, use completeTwoFactorLogin
        if (tempTokenRef.current) {
          mutation = `
            mutation CompleteTwoFactorLogin($input: CompleteTwoFactorLoginInput!) {
              completeTwoFactorLogin(input: $input) {
                accessToken
                refreshToken
                user {
                  id
                  email
                  username
                  firstName
                  lastName
                  isActive
                  role
                }
              }
            }
          `;
          variables = {
            input: {
              twoFactorTempToken: tempTokenRef.current,
              backupCode: backupCode,
            },
          };
        } else {
          // Submit login directly with backup code
          mutation = `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                accessToken
                refreshToken
                user {
                  id
                  email
                  username
                  firstName
                  lastName
                  isActive
                  role
                }
              }
            }
          `;
          variables = {
            input: {
              username: email,
              password: password,
              backupCode: backupCode,
            },
          };
        }
      } else {
        // Submit with TOTP code
        const digits = code.replace(/\s/g, '');
        if (digits.length !== 6) {
          setError('Please enter a complete 6-digit code');
          setIsLoading(false);
          return;
        }

        // If we have a temp token, use completeTwoFactorLogin
        if (tempTokenRef.current) {
          mutation = `
            mutation CompleteTwoFactorLogin($input: CompleteTwoFactorLoginInput!) {
              completeTwoFactorLogin(input: $input) {
                accessToken
                refreshToken
                user {
                  id
                  email
                  username
                  firstName
                  lastName
                  isActive
                  role
                }
              }
            }
          `;
          variables = {
            input: {
              twoFactorTempToken: tempTokenRef.current,
              twoFactorToken: digits,
            },
          };
        } else {
          // Submit login directly with TOTP token
          mutation = `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                accessToken
                refreshToken
                user {
                  id
                  email
                  username
                  firstName
                  lastName
                  isActive
                  role
                }
              }
            }
          `;
          variables = {
            input: {
              username: email,
              password: password,
              twoFactorToken: digits,
            },
          };
        }
      }

      const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          query: mutation,
          variables,
        }),
      });

      const result = await response.json();

      if (result.errors) {
        const errorMessage = result.errors[0]?.message || 'Authentication failed';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (result.data?.login) {
        const loginData = result.data.login;

        // Check if 2FA is still required
        if (loginData.requiresTwoFactor) {
          // Store the temp token for next step
          tempTokenRef.current = loginData.twoFactorTempToken;
          setIsLoading(false);
          return;
        }

        // Success - store tokens in cookies
        if (typeof window !== 'undefined') {
          const Cookies = (await import('js-cookie')).default;

          Cookies.set('access_token', loginData.accessToken, {
            expires: 1 / 24, // 1 hour
            path: '/',
            sameSite: 'lax',
          });

          Cookies.set('refresh_token', loginData.refreshToken, {
            expires: 7, // 7 days
            path: '/',
            sameSite: 'lax',
          });

          Cookies.set(
            'auth',
            JSON.stringify({
              user: loginData.user,
              roles: [loginData.user.role || 'user'],
            }),
            {
              expires: 7,
              path: '/',
              sameSite: 'lax',
            },
          );

          // Get redirect URL from query params or default to dashboard
          const redirectUrl = getRedirectUrl();

          // Redirect to the intended destination
          window.location.href = redirectUrl;
          return;
        }
      }

      if (result.data?.completeTwoFactorLogin) {
        const loginData = result.data.completeTwoFactorLogin;

        // Success - store tokens in cookies
        if (typeof window !== 'undefined') {
          const Cookies = (await import('js-cookie')).default;

          Cookies.set('access_token', loginData.accessToken, {
            expires: 1 / 24, // 1 hour
            path: '/',
            sameSite: 'lax',
          });

          Cookies.set('refresh_token', loginData.refreshToken, {
            expires: 7, // 7 days
            path: '/',
            sameSite: 'lax',
          });

          Cookies.set(
            'auth',
            JSON.stringify({
              user: loginData.user,
              roles: [loginData.user.role || 'user'],
            }),
            {
              expires: 7,
              path: '/',
              sameSite: 'lax',
            },
          );

          // Get redirect URL from query params or default to dashboard
          const redirectUrl = getRedirectUrl();

          // Redirect to the intended destination
          window.location.href = redirectUrl;
          return;
        }
      }

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleBackupCode = () => {
    setShowBackupCode(!showBackupCode);
    setError(null);
    setCode('');
    setBackupCode('');
  };

  const getProgressColor = () => {
    if (timeRemaining > 20) return 'bg-green-500';
    if (timeRemaining > 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/20 via-background to-background" />

      <Card className="w-full max-w-[400px] border-muted/40 bg-background/60 shadow-xl backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Two-Factor Authentication
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {showBackupCode
                ? 'Enter your 8-character backup code'
                : 'Enter the 6-digit code from your authenticator app'}
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {!showBackupCode ? (
              <div className="space-y-2">
                <Label htmlFor="totp-code" className="text-center">
                  Authentication Code
                </Label>
                <div className="flex justify-center">
                  <Input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000 000"
                    value={code}
                    onChange={handleCodeChange}
                    disabled={isLoading}
                    className="w-48 text-center text-2xl tracking-widest bg-background/50 transition-colors focus:bg-background disabled:opacity-50 font-mono"
                    maxLength={7}
                    autoComplete="one-time-code"
                  />
                </div>

                {/* Countdown timer */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-1000 ${getProgressColor()}`}
                      style={{ width: `${(timeRemaining / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {timeRemaining}s
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="backup-code" className="text-center">
                  Backup Code
                </Label>
                <div className="flex justify-center">
                  <Input
                    id="backup-code"
                    type="text"
                    inputMode="text"
                    placeholder="XXXX-XXXX"
                    value={backupCode}
                    onChange={handleBackupCodeChange}
                    disabled={isLoading}
                    className="w-48 text-center text-lg tracking-wider bg-background/50 transition-colors focus:bg-background disabled:opacity-50 font-mono uppercase"
                    maxLength={8}
                    autoComplete="off"
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Enter the code without dashes
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={toggleBackupCode}
                className="text-sm text-primary hover:underline disabled:opacity-50"
                disabled={isLoading}
              >
                {showBackupCode ? 'Use authenticator app instead' : 'Use a backup code'}
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-primary/25 transition-all"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full"
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
