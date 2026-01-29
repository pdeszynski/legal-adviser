'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@legal/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@legal/ui';
import { Label } from '@legal/ui';
import { ArrowLeft, Save, Key, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { dataProvider } from '@providers/data-provider';
import type { GraphQLMutationConfig } from '@providers/data-provider';

interface CreateUserForm {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

interface EmailCheckResult {
  exists: boolean;
  userId?: string;
  username?: string;
}

// Use generated types from admin.graphql (Note: EmailCheckResult would need a generated query type)

const defaultForm: CreateUserForm = {
  email: '',
  username: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  isActive: true,
};

export default function CreateUserPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateUserForm>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserForm | 'submit', string>>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<EmailCheckResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const handleChange = useCallback(
    (field: keyof CreateUserForm, value: string | boolean) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      // Clear email check result when email changes
      if (field === 'email') {
        setEmailExists(null);
      }
    },
    [errors],
  );

  const generateRandomPassword = useCallback(() => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }
    return password;
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const password = generateRandomPassword();
    setGeneratedPassword(password);
    handleChange('password', password);
    handleChange('confirmPassword', password);
  }, [generateRandomPassword, handleChange]);

  const handleCopyPassword = useCallback(() => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedPassword]);

  // Debounced email check
  useEffect(() => {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailExists(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const dp = dataProvider;
        if (!dp) return;

        const queryConfig = {
          url: '',
          method: 'post' as const,
          config: {
            query: {
              operation: 'checkEmailExists',
              fields: ['exists', 'userId', 'username'],
              variables: {
                email: form.email.toLowerCase().trim(),
              },
            },
          },
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (dp as any).custom(queryConfig);
        setEmailExists(result.data?.checkEmailExists || result.checkEmailExists);
      } catch {
        // Ignore errors during email check
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.email]);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof CreateUserForm, string>> = {};

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    } else if (emailExists?.exists) {
      newErrors.email = 'This email is already registered';
    }

    if (form.username && form.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, emailExists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      const dp = dataProvider;
      if (!dp) throw new Error('Data provider not available');

      const mutationConfig: GraphQLMutationConfig<{
        email: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        password: string;
        role?: 'user' | 'admin';
        isActive?: boolean;
      }> = {
        url: '',
        method: 'post',
        config: {
          mutation: {
            operation: 'adminCreateUser',
            fields: ['id', 'email', 'username', 'firstName', 'lastName', 'role', 'isActive'],
            variables: {
              input: {
                email: form.email.toLowerCase().trim(),
                username: form.username || undefined,
                firstName: form.firstName || undefined,
                lastName: form.lastName || undefined,
                password: form.password,
                role: form.role,
                isActive: form.isActive,
              },
            },
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (dp as any).custom(mutationConfig);
      const createdUser = result.data?.adminCreateUser || result.adminCreateUser;

      if (createdUser?.id) {
        setCreatedUserId(createdUser.id);
        setShowSuccess(true);

        // Redirect to user detail or list after success
        setTimeout(
          () => {
            if (createdUser.id) {
              router.push(`/admin/users?user=${createdUser.id}`);
            } else {
              router.push('/admin/users');
            }
          },
          generatedPassword ? 3000 : 1500,
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('username') || errorMessage.includes('Username')) {
        setErrors({ username: errorMessage });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">User Created Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                The user account for <strong>{form.email}</strong> has been created.
              </p>

              {generatedPassword && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-md p-4 max-w-md mx-auto">
                  <p className="text-sm font-medium text-green-600 mb-2">Generated Password</p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      readOnly
                      value={generatedPassword}
                      className="flex-1 px-3 py-2 border border-green-500/30 rounded-md bg-white dark:bg-gray-950 text-sm font-mono text-center"
                    />
                    <Button variant="outline" size="sm" onClick={handleCopyPassword}>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this password securely with the user. Redirecting...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
          <p className="text-muted-foreground">Add a new user to the system</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
          <CardDescription>Enter the details for the new user account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={isLoading}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              {emailExists?.exists && !errors.email && (
                <p className="text-sm text-destructive">
                  This email is already registered (username: {emailExists.username || 'N/A'})
                </p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={errors.username ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
              <p className="text-xs text-muted-foreground">
                Optional. Must be at least 3 characters, letters, numbers, underscores, dots, and
                hyphens only.
              </p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePassword}
                  disabled={isLoading}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters. User will be able to log in immediately.
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.role === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('role', 'user')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  User
                </Button>
                <Button
                  type="button"
                  variant={form.role === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleChange('role', 'admin')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Admin
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {form.role === 'user'
                  ? 'Standard user with access to main application features.'
                  : 'Administrator with full access to user management and system settings.'}
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                disabled={isLoading}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Account is active (user can log in)
              </Label>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/users')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || emailExists?.exists}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
