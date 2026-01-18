'use client';

import React from 'react';
import { StyledLanguageSelector } from '@components/select-language/styled-language-selector';
import Link from 'next/link';

export const PublicLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center px-4 py-4">
          <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
            Legal AI
          </Link>
          <div className="flex items-center gap-4">
            <StyledLanguageSelector />
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground bg-muted/30">
        &copy; {new Date().getFullYear()} Legal AI. All rights reserved.
      </footer>
    </div>
  );
};
