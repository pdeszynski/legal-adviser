'use client';

import { Suspense } from 'react';
import { PublicLayout } from '@components/layout/public-layout';
import { LoginContent } from './login-content';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <PublicLayout>
      <Suspense
        fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
      >
        <LoginContent />
      </Suspense>
    </PublicLayout>
  );
}
