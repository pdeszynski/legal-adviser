'use client';

// Basic imports only
import { Header } from '@components/layout/header';
import { Menu } from '@components/menu';

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r bg-muted/40 hidden md:block">
          <Menu />
        </aside>
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
