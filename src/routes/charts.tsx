import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import {
  BarChart,
  Chart,
  DonutChart,
  LineChart,
  RadarChart,
  RadialChart,
} from '@/components/charts';
import { CodeBlock } from '@/components/code-block';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/charts')({
  component: ChartsPage,
});

// ---------------------------------------------------------------------------
// Colours — reused across all distribution demos
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  available: 'oklch(0.65 0.18 150)',
  pending: 'oklch(0.75 0.16 75)',
  sold: 'oklch(0.6 0.16 255)',
};

// ---------------------------------------------------------------------------
// Mock time-series data
// ---------------------------------------------------------------------------

function generateTimeSeries(days = 30) {
  const data: { date: string; adoptions: number; listings: number }[] = [];
  let adoptions = 12;
  let listings = 20;
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    adoptions = Math.max(0, adoptions + Math.round((Math.random() - 0.45) * 6));
    listings = Math.max(0, listings + Math.round((Math.random() - 0.4) * 8));
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      adoptions,
      listings,
    });
  }
  return data;
}

// ---------------------------------------------------------------------------
// Code snippets
// ---------------------------------------------------------------------------

const SNIPPET_DISTRIBUTION = `// Pre-aggregated counts
<Chart
  type="donut"           // swap for: pie | bar | radar | radial
  counts={{ available: 372, pending: 116, sold: 7 }}
  keys={zPet.shape.status}          // enum options → legend order + zero-count rows
  colors={STATUS_COLORS} // optional per-value overrides
  title="Pet inventory"
/>

// Or let the component count from raw data
<Chart type="bar" data={pets} field="status" keys={zPet.shape.status} />`;

const SNIPPET_TIMESERIES = `<Chart
  type="line"          // or "area"
  data={timeSeries}
  x="date"
  y="adoptions"
  title="Daily adoptions"
  color="oklch(0.65 0.18 150)"
/>`;

const SNIPPET_DIRECT = `// Import individual components for full generic type safety
import { DonutChart } from '@/components/charts';

<DonutChart<Pet>
  counts={counts}
  keys={zPet.shape.status}
  totalLabel="total pets"
  innerRadius={68}
  outerRadius={92}
/>`;

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function ChartsPage() {
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

  const isLoading =
    availableQuery.isLoading || pendingQuery.isLoading || soldQuery.isLoading;

  const counts = {
    available: availableQuery.data?.length ?? 0,
    pending: pendingQuery.data?.length ?? 0,
    sold: soldQuery.data?.length ?? 0,
  };

  const timeSeries = useMemo(() => generateTimeSeries(30), []);

  const distProps = {
    counts,
    keys: zPet.shape.status,
    colors: STATUS_COLORS,
  } as const;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
        <p className="mt-1 text-muted-foreground">
          A thin wrapper around Recharts + shadcn charts. Pass{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">counts</code>{' '}
          or raw{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            data + field
          </code>{' '}
          — the component handles config, colours, and memoisation.
        </p>
      </div>

      {/* Distribution charts */}
      <Section
        title="Distribution charts"
        description="Count occurrences of a field across a dataset. All six variants accept the same props — swap type to change the visual."
      >
        <CodeBlock code={SNIPPET_DISTRIBUTION} lang="tsx" className="mb-4" />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[320px] rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DonutChart {...distProps} title="Donut" totalLabel="total pets" />
            <DonutChart
              {...distProps}
              title="Pie"
              innerRadius={0}
              showTotal={false}
            />
            <BarChart {...distProps} title="Bar" />
            <BarChart {...distProps} title="Bar (horizontal)" horizontal />
            <RadarChart {...distProps} title="Radar" />
            <RadialChart {...distProps} title="Radial" />
          </div>
        )}
      </Section>

      {/* Time series */}
      <Section
        title="Time series"
        description="Line and area charts for temporal data. Pass x/y field names directly."
      >
        <CodeBlock code={SNIPPET_TIMESERIES} lang="tsx" className="mb-4" />

        <div className="grid gap-4 sm:grid-cols-2">
          <LineChart
            data={timeSeries}
            x="date"
            y="adoptions"
            title="Line — daily adoptions"
            color={STATUS_COLORS.available}
          />
          <LineChart
            data={timeSeries}
            x="date"
            y="listings"
            title="Area — daily listings"
            area
            color={STATUS_COLORS.pending}
          />
        </div>
      </Section>

      {/* Unified <Chart> + direct imports */}
      <Section
        title="Two ways to use"
        description="<Chart type='...'> lazy-loads the right component. For full TypeScript field-key safety, import the component directly."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Unified{' '}
              <code className="rounded bg-muted px-1 text-xs">
                &lt;Chart&gt;
              </code>{' '}
              — lazy-loaded, swappable type
            </p>
            <CodeBlock
              code={`<Chart type="donut" counts={counts} keys={zPet.shape.status} />`}
              lang="tsx"
            />
            {!isLoading && (
              <Chart
                type="donut"
                counts={counts}
                keys={zPet.shape.status}
                colors={STATUS_COLORS}
                title="Via <Chart type='donut'>"
                totalLabel="pets"
              />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">
              Direct import — full generic type safety
            </p>
            <CodeBlock code={SNIPPET_DIRECT} lang="tsx" />
            {!isLoading && (
              <DonutChart
                counts={counts}
                keys={zPet.shape.status}
                colors={STATUS_COLORS}
                title="Via <DonutChart> directly"
                totalLabel="pets"
              />
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
