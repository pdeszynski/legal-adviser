'use client';

import React, { useState, useCallback } from 'react';
import { X, Key, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button, Input } from '@legal/ui';
import { Label } from '@legal/ui';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

interface UserPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: () => void;
}

export function UserPasswordDialog({ open, onClose, user, onUpdate }: UserPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatePassword, setGeneratePassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const resetForm = useCallback(() => {
    setNewPassword('');
    setConfirmPassword('');
    setGeneratePassword(false);
    setGeneratedPassword('');
    setErrors({});
    setSuccessMessage('');
    setCopied(false);
  }, []);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const generateRandomPassword = useCallback(() => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const password = generateRandomPassword();
    setGeneratedPassword(password);
    setNewPassword(password);
    setConfirmPassword(password);
    setGeneratePassword(true);
    setErrors({});
  }, [generateRandomPassword]);

  const handleCopyPassword = useCallback(() => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedPassword]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;

    // Validate
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      const mutationConfig: GraphQLMutationConfig<{ userId: string; newPassword: string }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'resetUserPassword',
            fields: ['id', 'email'],
            variables: {
              input: {
                userId: user.id,
                newPassword,
              },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dp as any).custom(mutationConfig);

      setSuccessMessage('Password reset successfully!');
      setErrors({});

      // Auto-close after success with generated password
      if (generatePassword) {
        setTimeout(() => {
          onUpdate();
          onClose();
        }, 2000);
      } else {
        setTimeout(() => {
          onUpdate();
          onClose();
        }, 1500);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to reset password:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to reset password',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, newPassword, confirmPassword, generatePassword, onUpdate, onClose]);

  const getDisplayName = () => {
    if (!user) return '';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-reset-title"
    >
      <div className="bg-background rounded-lg shadow-2xl max-w-md w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 id="password-reset-title" className="text-xl font-semibold flex items-center gap-2">
              <Key className="w-5 h-5" />
              Reset Password
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              For {getDisplayName()} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-md transition-colors"
            aria-label="Close dialog"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {errors.submit && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-600 flex items-center gap-2">
                <Check className="h-4 w-4" />
                {successMessage}
              </p>
            </div>
          )}

          {!generatePassword ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter a new password for this user. They will be able to log in immediately with
                  the new password.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePassword}
                  className="w-full"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Random Password
                </Button>
              </div>

              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.newPassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={errors.newPassword ? 'border-destructive pr-10' : 'pr-10'}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.confirmPassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className={newPassword.length >= 8 ? 'text-green-600' : ''}>
                      {newPassword.length >= 8 ? '✓' : '•'} At least 8 characters
                    </li>
                    <li
                      className={
                        newPassword === confirmPassword && newPassword.length > 0
                          ? 'text-green-600'
                          : ''
                      }
                    >
                      {newPassword === confirmPassword && newPassword.length > 0 ? '✓' : '•'} Both
                      passwords match
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4">
                <p className="text-sm font-medium text-green-600 mb-2">Password Generated!</p>
                <div className="flex gap-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    readOnly
                    value={generatedPassword}
                    className="flex-1 px-3 py-2 border border-green-500/30 rounded-md bg-white dark:bg-gray-950 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPassword}
                    className="min-w-[100px]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Share this password securely with the user. They can change it after logging in.
                </p>
              </div>

              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Important:</strong> This password will only be shown once. Make sure to
                  copy it and share it securely with the user.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 rounded-b-lg flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading || successMessage !== ''}>
            Cancel
          </Button>
          {!generatePassword && (
            <Button onClick={handleSubmit} disabled={isLoading || successMessage !== ''}>
              <Key className="h-4 w-4 mr-2" />
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
