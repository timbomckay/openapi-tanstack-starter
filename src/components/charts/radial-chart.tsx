import { memo, useMemo } from 'react';

import { RadialBar, RadialBarChart as RechartsRadialBarChart } from 'recharts';

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

export type RadialChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = DistributionChartProps<T> & {
  /** Inner radius in px. Default 30. */
  innerRadius?: number;
  /** Outer radius in px. Default 100. */
  outerRadius?: number;
  /** Approximate height of the chart area in px. Default 280. */
  chartHeight?: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RadialChartInner<T extends Record<string, unknown>>({
  keys,
  colors,
  labels,
  title,
  className,
  innerRadius = 30,
  outerRadius = 100,
  chartHeight = 280,
  animate = false,
  interactive = true,
  onValueClick,
  ...sourceProps
}: RadialChartProps<T>) {
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
      <CardContent className="flex flex-col items-center pb-3">
        <ChartContainer
          config={chartConfig}
          style={{ height: chartHeight }}
          className="w-full"
        >
          <RechartsRadialBarChart
            data={displayData}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
          >
            <ChartTooltip
              content={<ChartTooltipContent nameKey="key" hideLabel />}
            />
            <RadialBar
              dataKey="count"
              background
              isAnimationActive={animate}
              onMouseEnter={(data) => {
                if (interactive)
                  startHover((data as unknown as { cssKey: string }).cssKey);
              }}
              onMouseLeave={() => {
                if (interactive) endHover();
              }}
              onClick={(data) => {
                onValueClick?.(
                  (data as unknown as { key: string }).key,
                  (data as unknown as { count: number }).count,
                );
              }}
              style={{ cursor: onValueClick ? 'pointer' : undefined }}
            />
          </RechartsRadialBarChart>
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

export const RadialChart = memo(RadialChartInner) as typeof RadialChartInner;
export default RadialChart;
