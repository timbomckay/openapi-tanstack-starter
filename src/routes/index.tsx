import {
  PlusCircleIcon,
  PawPrintIcon,
  ClockCountdownIcon,
  TagIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { DonutChart } from '@/components/charts';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

// ---------------------------------------------------------------------------
// Distinct semantic colors — override the all-blue chart palette
// ---------------------------------------------------------------------------

const COLORS = {
  available: 'oklch(0.65 0.18 150)', // green
  pending: 'oklch(0.75 0.16 75)', // amber
  sold: 'oklch(0.6  0.16 255)', // indigo/blue
} as const;

const statusMeta = {
  available: {
    icon: PawPrintIcon,
    color: COLORS.available,
    description: 'Ready to adopt',
  },
  pending: {
    icon: ClockCountdownIcon,
    color: COLORS.pending,
    description: 'Awaiting confirmation',
  },
  sold: {
    icon: TagIcon,
    color: COLORS.sold,
    description: 'Successfully rehomed',
  },
} as const;

// ---------------------------------------------------------------------------
// Stat card — compact horizontal layout for use in a 3-up row
// ---------------------------------------------------------------------------

function StatCard({
  status,
  count,
  total,
  loading,
}: {
  status: 'available' | 'pending' | 'sold';
  count: number | undefined;
  total: number;
  loading: boolean;
}) {
  const { icon: Icon, color, description } = statusMeta[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const pct =
    total > 0 && count != null ? Math.round((count / total) * 100) : null;

  return (
    <Link to="/pets" search={{ status }} className="group">
      <Card className="relative h-full overflow-hidden transition-colors hover:bg-muted/40">
        <span
          className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
          style={{ background: color }}
        />
        <CardHeader className="flex flex-row items-start justify-between pb-2 pl-5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <Icon
            className="size-4 shrink-0 transition-transform group-hover:scale-110"
            weight="fill"
            style={{ color }}
          />
        </CardHeader>
        <CardContent className="pl-5">
          {loading ? (
            <Skeleton className="mb-1 h-8 w-16" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums">
                {count ?? '—'}
              </span>
              {pct != null && (
                <span className="text-sm font-medium text-muted-foreground">
                  {pct}%
                </span>
              )}
            </div>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            {description}
            <ArrowRightIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct ?? 0}%`, background: color }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DashboardPage() {
  const availableQuery = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'available' },
    }),
  );
  const pendingQuery = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'pending' },
    }),
  );
  const soldQuery = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'sold' },
    }),
  );

  const counts = {
    available: availableQuery.data?.length ?? 0,
    pending: pendingQuery.data?.length ?? 0,
    sold: soldQuery.data?.length ?? 0,
  };
  const total = counts.available + counts.pending + counts.sold;
  const isLoading =
    availableQuery.isLoading || pendingQuery.isLoading || soldQuery.isLoading;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Petstore inventory overview powered by the Petstore v3 API.
          </p>
        </div>
        <Link to="/pets/new" className={buttonVariants()}>
          <PlusCircleIcon className="mr-2 size-4" weight="fill" />
          Add Pet
        </Link>
      </div>

      {/* Stat cards — 3 columns */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          status="available"
          count={counts.available}
          total={total}
          loading={availableQuery.isLoading}
        />
        <StatCard
          status="pending"
          count={counts.pending}
          total={total}
          loading={pendingQuery.isLoading}
        />
        <StatCard
          status="sold"
          count={counts.sold}
          total={total}
          loading={soldQuery.isLoading}
        />
      </div>

      {/* Chart + actions row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Donut — spans 2 columns */}
        <div className="md:col-span-2">
          {isLoading ? (
            <Skeleton className="h-80 w-full rounded-xl" />
          ) : (
            <DonutChart
              counts={counts}
              keys={zPet.shape.status}
              colors={COLORS}
              title="Inventory breakdown"
              totalLabel="total pets"
              className="h-full"
            />
          )}
        </div>

        {/* Action cards — stacked in the 3rd column */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <PawPrintIcon className="size-4 text-primary" weight="fill" />
                Browse inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Filter, sort, and inspect all pets across every status.
              </p>
              <Link
                to="/pets"
                search={{ status: 'available' }}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                View all pets
                <ArrowRightIcon className="ml-1.5 size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <PlusCircleIcon className="size-4 text-primary" weight="fill" />
                Add new pet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Register a new pet with name, status, and tags.
              </p>
              <Link to="/pets/new" className={buttonVariants({ size: 'sm' })}>
                Add pet
                <ArrowRightIcon className="ml-1.5 size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
