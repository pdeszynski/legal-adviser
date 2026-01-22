'use client';

import { useState, useEffect } from 'react';
import { useLogin } from '@refinedev/core';
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
import { Scale } from 'lucide-react';
// ...
export const LoginContent = () => {
  const { mutate: login, isPending: isLoading, error } = useLogin();

  const [initialError, setInitialError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(globalThis.window.location.search);
    const error = searchParams.get('error');
    if (error) setInitialError(error);
  }, []);

  const [email, setEmail] = useState('admin@refine.dev');
  const [password, setPassword] = useState('password');

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setValidationError(null);
    setInitialError(null);

    if (!email) {
      setValidationError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setValidationError('Password is required');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long');
      return;
    }

    login({ email, password });
  };

  // Priority: Validation Error > Login Hook Error > URL/Initial Error
  const authError = error ? 'Invalid email or password' : null;
  const errorMessage =
    validationError || authError || (initialError ? 'Invalid email or password.' : null);

  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400/20 via-background to-background" />

      <Card className="w-full max-w-[400px] border-muted/40 bg-background/60 shadow-xl backdrop-blur-xl transition-all hover:bg-background/80 hover:shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to your legal workspace
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                className="bg-background/50 transition-colors focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground hover:text-primary cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
                className="bg-background/50 transition-colors focus:bg-background"
              />
            </div>
            {errorMessage && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1 text-center">
                {errorMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-primary/25 transition-all"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="text-center text-xs text-muted-foreground">
              Don&apos;t have an account?{' '}
              <span className="cursor-pointer font-medium text-primary hover:underline">
                Request access
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
