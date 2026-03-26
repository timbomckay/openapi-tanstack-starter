import {
  PlusCircleIcon,
  PawPrintIcon,
  ClockCountdownIcon,
  TagIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Label, Pie, PieChart } from 'recharts';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

// ---------------------------------------------------------------------------
// Distinct semantic colors — override the all-blue chart palette
// ---------------------------------------------------------------------------

// oklch values chosen to be clearly distinct and readable in both themes
const COLORS = {
  available: 'oklch(0.65 0.18 150)', // green — matches primary
  pending: 'oklch(0.75 0.16 75)', // amber
  sold: 'oklch(0.6  0.16 255)', // indigo/blue
} as const;

const chartConfig = {
  available: { label: 'Available', color: COLORS.available },
  pending: { label: 'Pending', color: COLORS.pending },
  sold: { label: 'Sold', color: COLORS.sold },
} satisfies ChartConfig;

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
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  status,
  count,
  total,
  loading,
  className = '',
}: {
  status: 'available' | 'pending' | 'sold';
  count: number | undefined;
  total: number;
  loading: boolean;
  className?: string;
}) {
  const { icon: Icon, color, description } = statusMeta[status];
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const pct =
    total > 0 && count != null ? Math.round((count / total) * 100) : null;

  return (
    <Link
      to="/pets"
      search={{ status }}
      className={`group flex flex-col ${className}`}
    >
      <Card className="relative flex flex-1 flex-col overflow-hidden transition-colors hover:bg-muted/40">
        {/* Coloured left accent bar */}
        <span
          className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
          style={{ background: color }}
        />

        <CardHeader className="flex flex-row items-start justify-between pb-1 pl-5">
          <div className="space-y-0.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {label}
            </p>
          </div>
          <Icon
            className="size-5 shrink-0 transition-transform group-hover:scale-110"
            weight="fill"
            style={{ color }}
          />
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between pl-5">
          {loading ? (
            <Skeleton className="mb-2 h-9 w-20" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">
                {count ?? '—'}
              </span>
              {pct != null && (
                <span className="text-sm font-medium text-muted-foreground">
                  {pct}%
                </span>
              )}
            </div>
          )}

          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {description}
            <ArrowRightIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </p>

          {/* Mini proportion bar */}
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
// Donut chart
// ---------------------------------------------------------------------------

function InventoryDonut({
  available,
  pending,
  sold,
  loading,
}: {
  available: number;
  pending: number;
  sold: number;
  loading: boolean;
}) {
  const total = available + pending + sold;

  const chartData = [
    { status: 'available', count: available, fill: 'var(--color-available)' },
    { status: 'pending', count: pending, fill: 'var(--color-pending)' },
    { status: 'sold', count: sold, fill: 'var(--color-sold)' },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Inventory breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {loading ? (
          <div className="flex justify-center py-6">
            <Skeleton className="size-[180px] rounded-full" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[220px] w-full"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={68}
                outerRadius={90}
                strokeWidth={2}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null;
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) - 10}
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            fill: 'currentColor',
                          }}
                        >
                          {total.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 16}
                          style={{
                            fontSize: 12,
                            fill: 'var(--muted-foreground)',
                          }}
                        >
                          total pets
                        </tspan>
                      </text>
                    );
                  }}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
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
    <div className="space-y-6">
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

      {/* Main grid — stat cards + chart side by side at md+ */}
      <div className="grid gap-4 md:grid-cols-5">
        {/* Stat cards — stack on the left (2 cols), stretch to match chart height */}
        <div className="flex h-full flex-col gap-4 md:col-span-2">
          <StatCard
            status="available"
            count={counts.available}
            total={total}
            loading={availableQuery.isLoading}
            className="flex-1"
          />
          <StatCard
            status="pending"
            count={counts.pending}
            total={total}
            loading={pendingQuery.isLoading}
            className="flex-1"
          />
          <StatCard
            status="sold"
            count={counts.sold}
            total={total}
            loading={soldQuery.isLoading}
            className="flex-1"
          />
        </div>

        {/* Donut chart — right (3 cols) */}
        <div className="md:col-span-3">
          <InventoryDonut
            available={counts.available}
            pending={counts.pending}
            sold={counts.sold}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="group">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PawPrintIcon className="size-4 text-primary" weight="fill" />
              Browse inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PlusCircleIcon className="size-4 text-primary" weight="fill" />
              Add new pet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
  );
}
