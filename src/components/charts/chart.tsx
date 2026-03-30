import { lazy, Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import type { ChartProps } from './types';

// ---------------------------------------------------------------------------
// Lazy-loaded chart types — each type is a separate JS chunk so unused chart
// types are not loaded until first render.
// ---------------------------------------------------------------------------

const DonutChart = lazy(() => import('./donut-chart'));
const BarChart = lazy(() => import('./bar-chart'));
const LineChart = lazy(() => import('./line-chart'));
const RadarChart = lazy(() => import('./radar-chart'));
const RadialChart = lazy(() => import('./radial-chart'));

function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full rounded-xl" />;
}

// ---------------------------------------------------------------------------
// Unified <Chart> dispatch component
//
// For full TypeScript field-key safety, import individual chart components
// directly (e.g. `import { DonutChart } from '@/components/charts'`).
// This component accepts `Record<string, unknown>` generics to stay simple.
// ---------------------------------------------------------------------------

/**
 * Single entry-point for all chart types. Lazily loads the underlying chart
 * component so only the used chart types end up in the initial bundle.
 *
 * @example
 * ```tsx
 * // Distribution (donut)
 * <Chart type="donut" data={pets} field="status" schema={zPet} title="Inventory" />
 *
 * // Distribution (bar)
 * <Chart type="bar" data={pets} field="status" />
 *
 * // Time series
 * <Chart type="line" data={events} x="date" y="count" area />
 * ```
 */
export function Chart(props: ChartProps) {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      {props.type === 'donut' && <DonutChart {...props} />}
      {props.type === 'pie' && <DonutChart {...props} innerRadius={0} />}
      {props.type === 'bar' && <BarChart {...props} />}
      {props.type === 'radar' && <RadarChart {...props} />}
      {props.type === 'radial' && <RadialChart {...props} />}
      {(props.type === 'line' || props.type === 'area') && (
        <LineChart {...props} area={props.type === 'area'} />
      )}
    </Suspense>
  );
}
