'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@legal/ui';
import { Button } from '@legal/ui';
import { Input } from '@legal/ui';
import { Label } from '@legal/ui';
import {
  Shield,
  QrCode,
  Key,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import QRCode from 'react-qr-code';
import Cookies from 'js-cookie';
import { getCsrfHeaders } from '@/lib/csrf';

type SetupStep = 'info' | 'scan' | 'verify' | 'success' | 'disable' | 'manage' | 'regenerate';

interface EnableTwoFactorResponse {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

interface TwoFactorSettings {
  status: string;
  enabled: boolean;
  remainingBackupCodes?: number | null;
  lastVerifiedAt?: string | null;
}

interface TwoFactorSetupProps {
  isEnabled: boolean;
  remainingCodes?: number | null;
  lastVerifiedAt?: string | null;
  onComplete: () => void;
}

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql';

/**
 * Two-Factor Authentication Setup Component
 *
 * Step-by-step wizard for enabling/disabling 2FA:
 * 1. Info modal explaining 2FA benefits
 * 2. QR code display for scanning with authenticator app
 * 3. Manual secret entry option as backup
 * 4. Input field for entering 6-digit verification code
 * 5. Success state displaying 10 backup codes for download/printing
 * 6. Manage state for regenerating backup codes or disabling 2FA
 */
export function TwoFactorSetup({
  isEnabled,
  remainingCodes,
  lastVerifiedAt,
  onComplete,
}: TwoFactorSetupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<SetupStep>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  // 2FA setup data
  const [setupData, setSetupData] = useState<EnableTwoFactorResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Format last verified date
  const formatLastVerifiedDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = Cookies.get('access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const graphqlRequest = async <T,>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...getCsrfHeaders(),
    };

    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL request failed');
    }

    return result.data;
  };

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mutation = `
        mutation EnableTwoFactorAuth {
          enableTwoFactorAuth {
            secret
            qrCodeDataUrl
            backupCodes
          }
        }
      `;

      const result = await graphqlRequest<{ enableTwoFactorAuth: EnableTwoFactorResponse }>(
        mutation,
      );
      setSetupData(result.enableTwoFactorAuth);
      setBackupCodes(result.enableTwoFactorAuth.backupCodes);
      setStep('scan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const digits = verificationCode.replace(/\s/g, '');
    if (digits.length !== 6) {
      setError('Please enter a complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const mutation = `
        mutation VerifyTwoFactorSetup($input: VerifyTwoFactorSetupInput!) {
          verifyTwoFactorSetup(input: $input) {
            success
            backupCodes
          }
        }
      `;

      const result = await graphqlRequest<{
        verifyTwoFactorSetup: { success: boolean; backupCodes: string[] };
      }>(mutation, { input: { token: digits } });

      if (result.verifyTwoFactorSetup.success) {
        setBackupCodes(result.verifyTwoFactorSetup.backupCodes);
        setStep('success');
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }, [verificationCode, onComplete]);

  const handleDisable = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!disablePassword) {
      setError('Please enter your password to confirm');
      setIsLoading(false);
      return;
    }

    try {
      const mutation = `
        mutation DisableTwoFactorAuth($input: DisableTwoFactorInput!) {
          disableTwoFactorAuth(input: $input)
        }
      `;

      await graphqlRequest<boolean>(mutation, { input: { password: disablePassword } });
      setIsOpen(false);
      setStep('info');
      setDisablePassword('');
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable two-factor authentication');
    } finally {
      setIsLoading(false);
    }
  }, [disablePassword, onComplete]);

  const handleRegenerateBackupCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mutation = `
        mutation RegenerateBackupCodes {
          regenerateBackupCodes {
            codes
          }
        }
      `;

      const result = await graphqlRequest<{ regenerateBackupCodes: { codes: string[] } }>(mutation);
      setBackupCodes(result.regenerateBackupCodes.codes);
      setStep('regenerate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate backup codes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOpenDialog = () => {
    setStep(isEnabled ? 'manage' : 'info');
    setError(null);
    setVerificationCode('');
    setDisablePassword('');
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setStep('info');
    setError(null);
    setVerificationCode('');
    setDisablePassword('');
    setSetupData(null);
  };

  const copyCodesToClipboard = async () => {
    const text = backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatVerificationCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 3) return digits;
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  };

  return (
    <>
      {/* Status Card */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${isEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
              {isEnabled ? (
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Shield className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? 'Enabled - Your account is protected'
                  : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleOpenDialog}
            variant={isEnabled ? 'outline' : 'default'}
          >
            {isEnabled ? 'Manage' : 'Enable'}
          </Button>
        </div>

        {isEnabled && (
          <div className="ml-12 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              <span>{remainingCodes ?? 0} backup codes remaining</span>
            </div>
            {lastVerifiedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Last verified: {formatLastVerifiedDate(lastVerifiedAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setup Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          {step === 'info' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Two-Factor Authentication
                </DialogTitle>
                <DialogDescription>
                  Add an extra layer of security to your account by requiring a code from your
                  authenticator app when signing in.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">How it works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">1.</span>
                      <span>
                        Scan a QR code with your authenticator app (Google Authenticator, Authy,
                        etc.)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">2.</span>
                      <span>Enter the 6-digit code from your app to verify setup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">3.</span>
                      <span>Save your backup codes for account recovery</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Important:</strong> Make sure to save your
                    backup codes. They are the only way to access your account if you lose your
                    authenticator device.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleEnable} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Get Started'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'scan' && setupData && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Scan QR Code
                </DialogTitle>
                <DialogDescription>Scan this QR code with your authenticator app</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* QR Code Display */}
                <div className="flex justify-center bg-white p-4 rounded-lg border">
                  {setupData.qrCodeDataUrl ? (
                    <img
                      src={setupData.qrCodeDataUrl}
                      alt="QR Code for 2FA setup"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <QRCode
                        value={`otpauth://totp/LegalAI:${encodeURIComponent('user')}?secret=${setupData.secret}&issuer=LegalAI`}
                        size={180}
                      />
                    </div>
                  )}
                </div>

                {/* Manual Secret Entry (Backup) */}
                <details className="text-sm">
                  <summary className="cursor-pointer text-primary hover:underline">
                    Can't scan? Enter code manually
                  </summary>
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <Label className="text-xs text-muted-foreground">Secret Key:</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 font-mono text-sm bg-background px-2 py-1 rounded">
                        {showSecret ? setupData.secret : setupData.secret.replace(/./g, '•')}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </details>

                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="verify-code">Enter 6-digit code</Label>
                  <Input
                    id="verify-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000 000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(formatVerificationCode(e.target.value))}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={7}
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.replace(/\s/g, '').length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Two-Factor Authentication Enabled
                </DialogTitle>
                <DialogDescription>Your account is now protected with 2FA</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">
                    Save Your Backup Codes
                  </h4>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80">
                    These codes are the only way to access your account if you lose your
                    authenticator device. Save them now - you won't see them again!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="text-center font-mono text-sm bg-muted px-2 py-1.5 rounded"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={copyCodesToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={downloadCodes}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Store these codes securely:</strong> Print them, save them in a password
                    manager, or store them in a secure location. Each code can only be used once.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" onClick={handleCloseDialog}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'disable' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Disable Two-Factor Authentication
                </DialogTitle>
                <DialogDescription>This will make your account less secure</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Warning:</strong> Disabling 2FA removes an important layer of security
                    from your account. Your account will only be protected by your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="disable-password">Confirm your password</Label>
                  <div className="relative">
                    <Input
                      id="disable-password"
                      type={showPassword ? 'text' : 'password'}
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDisable}
                  disabled={isLoading || !disablePassword}
                >
                  {isLoading ? 'Disabling...' : 'Disable 2FA'}
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'manage' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Two-Factor Authentication Settings
                </DialogTitle>
                <DialogDescription>
                  Manage your two-factor authentication settings
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Status Info */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-700 dark:text-green-300">
                      Two-Factor Authentication is Enabled
                    </h4>
                  </div>
                  {lastVerifiedAt && (
                    <p className="text-sm text-green-600/80 dark:text-green-400/80">
                      Last verified: {formatLastVerifiedDate(lastVerifiedAt)}
                    </p>
                  )}
                </div>

                {/* Backup Codes Info */}
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium mb-1">Backup Codes</h4>
                      <p className="text-sm text-muted-foreground">
                        {remainingCodes ?? 0} of 10 codes remaining
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateBackupCodes}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Generating...' : 'Regenerate'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use backup codes when you don't have access to your authenticator device.
                  </p>
                </div>

                {/* Warning about disabling */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Warning:</strong> Disabling 2FA removes an important layer of security
                    from your account. Your account will only be protected by your password.
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
                <Button type="button" variant="destructive" onClick={() => setStep('disable')}>
                  Disable 2FA
                </Button>
              </DialogFooter>
            </>
          )}

          {step === 'regenerate' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  New Backup Codes
                </DialogTitle>
                <DialogDescription>Save these new backup codes securely</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                    Save Your New Backup Codes
                  </h4>
                  <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                    Your old backup codes have been invalidated. Save these new codes now - you
                    won't see them again!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code
                      key={index}
                      className="text-center font-mono text-sm bg-muted px-2 py-1.5 rounded"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={copyCodesToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={downloadCodes}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" onClick={handleCloseDialog}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
