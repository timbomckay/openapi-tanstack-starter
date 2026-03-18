import { PawPrintIcon } from '@phosphor-icons/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <nav className="container mx-auto flex h-14 items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <PawPrintIcon className="size-5" />
            <span>Petstore</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              to="/pets"
              className="text-muted-foreground transition-colors hover:text-foreground [&.active]:font-medium [&.active]:text-foreground"
            >
              Pets
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <Toaster />
      <TanStackRouterDevtools />
      <ReactQueryDevtools />
    </div>
  );
}
