import { memo, useMemo } from 'react';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
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

export type RadarChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = DistributionChartProps<T> & {
  /** Fill opacity for the radar polygon. Default 0.4. */
  fillOpacity?: number;
  /** Approximate height of the chart area in px. Default 280. */
  chartHeight?: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function RadarChartInner<T extends Record<string, unknown>>({
  keys,
  colors,
  labels,
  title,
  className,
  fillOpacity = 0.4,
  chartHeight = 280,
  animate = false,
  interactive = true,
  onValueClick: _onValueClick,
  ...sourceProps
}: RadarChartProps<T>) {
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

  const visibleData = useMemo(
    () => chartData.filter((d) => !hiddenKeys.has(d.cssKey)),
    [chartData, hiddenKeys],
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

  const primaryColor =
    Object.values(chartConfig)[0]?.color ?? 'oklch(0.65 0.18 150)';

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
          <RechartsRadarChart data={visibleData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="key" />
            <PolarRadiusAxis tick={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              dataKey="count"
              fill={primaryColor}
              fillOpacity={fillOpacity}
              stroke={primaryColor}
              isAnimationActive={animate}
            />
          </RechartsRadarChart>
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

export const RadarChart = memo(RadarChartInner) as typeof RadarChartInner;
export default RadarChart;
