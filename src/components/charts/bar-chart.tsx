import { memo, useMemo } from 'react';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  type BarProps,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import type { DistributionChartProps } from './types';

import {
  InteractiveLegend,
  useChartInteraction,
  type LegendEntry,
} from './interactive-legend';
import { buildDistributionData } from './utils';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type BarChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = DistributionChartProps<T> & {
  horizontal?: boolean;
  chartHeight?: number;
};

// ---------------------------------------------------------------------------
// Shape renderer — per-bar colour + opacity, replaces deprecated <Cell>
// ---------------------------------------------------------------------------

function ColoredBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  fill,
  opacity = 1,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  opacity?: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={Math.max(0, width)}
      height={Math.max(0, height)}
      fill={fill}
      opacity={opacity}
      rx={4}
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function BarChartInner<T extends Record<string, unknown>>({
  keys,
  colors,
  labels,
  title,
  className,
  horizontal = false,
  chartHeight = 240,
  animate = false,
  interactive = true,
  onValueClick,
  ...sourceProps
}: BarChartProps<T>) {
  const source = sourceProps.counts
    ? { counts: sourceProps.counts }
    : {
        data: sourceProps.data as Record<string, unknown>[],
        field: sourceProps.field!,
      };

  const { chartData, chartConfig } = useMemo(
    () => buildDistributionData(source, { keys, colors, labels }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      sourceProps.counts,
      sourceProps.data,
      sourceProps.field,
      keys,
      colors,
      labels,
    ],
  );

  const { hiddenKeys, hoverKey, toggle, startHover, endHover } =
    useChartInteraction();

  const displayData = useMemo(
    () =>
      chartData
        .filter((d) => !hiddenKeys.has(d.cssKey))
        .map((d) => ({
          ...d,
          opacity: hoverKey && hoverKey !== d.cssKey ? 0.3 : 1,
        })),
    [chartData, hiddenKeys, hoverKey],
  );

  const legendItems = useMemo<LegendEntry[]>(
    () =>
      chartData.map((d) => ({
        cssKey: d.cssKey,
        label: (chartConfig[d.cssKey]?.label as string) ?? d.key,
        color: (chartConfig[d.cssKey]?.color as string) ?? '#888',
      })),
    [chartData, chartConfig],
  );

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pb-3">
        <ChartContainer
          config={chartConfig}
          style={{ height: chartHeight }}
          className="w-full"
        >
          <RechartsBarChart
            data={displayData}
            layout={horizontal ? 'vertical' : 'horizontal'}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={horizontal}
              horizontal={!horizontal}
            />
            {horizontal ? (
              <>
                <XAxis type="number" />
                <YAxis dataKey="key" type="category" width={90} />
              </>
            ) : (
              <>
                <XAxis dataKey="key" />
                <YAxis />
              </>
            )}
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="count"
              shape={ColoredBar as BarProps['shape']}
              isAnimationActive={animate}
              onMouseEnter={(data) =>
                interactive && startHover((data as { cssKey: string }).cssKey)
              }
              onMouseLeave={() => interactive && endHover()}
              onClick={(data) =>
                onValueClick?.(
                  (data as { key: string }).key,
                  (data as { count: number }).count,
                )
              }
              style={{ cursor: onValueClick ? 'pointer' : undefined }}
            />
          </RechartsBarChart>
        </ChartContainer>

        <InteractiveLegend
          items={legendItems}
          hiddenKeys={hiddenKeys}
          hoverKey={hoverKey}
          onToggle={interactive ? toggle : undefined}
          onHoverEnter={interactive ? startHover : undefined}
          onHoverLeave={interactive ? endHover : undefined}
        />
      </CardContent>
    </Card>
  );
}

export const BarChart = memo(BarChartInner) as typeof BarChartInner;
export default BarChart;
