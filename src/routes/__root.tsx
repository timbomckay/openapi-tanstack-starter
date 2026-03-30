import { PawPrintIcon } from '@phosphor-icons/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { ModeToggle } from '@/components/mode-toggle';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background pb-24">
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
              <Link
                to="/demo"
                className="text-muted-foreground transition-colors hover:text-foreground [&.active]:font-medium [&.active]:text-foreground"
              >
                Form demo
              </Link>
              <Link
                to="/charts"
                className="text-muted-foreground transition-colors hover:text-foreground [&.active]:font-medium [&.active]:text-foreground"
              >
                Charts
              </Link>
              <Link
                to="/pipeline"
                className="text-muted-foreground transition-colors hover:text-foreground [&.active]:font-medium [&.active]:text-foreground"
              >
                Pipeline
              </Link>
            </div>
            <div className="ml-auto">
              <ModeToggle />
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
    </ThemeProvider>
  );
}
