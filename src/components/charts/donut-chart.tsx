import { memo, useMemo } from 'react';

import type { PieSectorDataItem } from 'recharts';

import { Label, Pie, PieChart, Sector } from 'recharts';
// PieSectorDataItem is used in the sectorShape callback below

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

export type DonutChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = DistributionChartProps<T> & {
  innerRadius?: number;
  outerRadius?: number;
  totalLabel?: string;
  showTotal?: boolean;
  chartHeight?: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DonutChartInner<T extends Record<string, unknown>>({
  keys,
  colors,
  labels,
  title,
  className,
  innerRadius = 68,
  outerRadius = 92,
  totalLabel = 'total',
  showTotal = true,
  chartHeight = 240,
  animate = false,
  interactive = true,
  onValueClick,
  ...sourceProps
}: DonutChartProps<T>) {
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

  // Total reflects only visible (non-toggled-off) slices
  const visibleTotal = useMemo(
    () => visibleData.reduce((sum, d) => sum + d.count, 0),
    [visibleData],
  );

  // Single shape handler for all slices — expands the hovered one, dims the rest.
  // Using shape-only (no activeIndex/activeShape) so legend hover and direct
  // pie hover both work identically.
  const sectorShape = useMemo(
    () => (props: PieSectorDataItem) => {
      const cssKey = (props as { cssKey?: string }).cssKey ?? '';
      const isActive = !!hoverKey && hoverKey === cssKey;
      const isDimmed = !!hoverKey && !isActive;
      return (
        <Sector
          {...props}
          outerRadius={(props.outerRadius ?? outerRadius) + (isActive ? 7 : 0)}
          opacity={isDimmed ? 0.3 : 1}
        />
      );
    },
    [hoverKey, outerRadius],
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
    <Card className={`flex flex-col ${className ?? ''}`}>
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
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={visibleData}
              dataKey="count"
              nameKey="cssKey"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              strokeWidth={2}
              isAnimationActive={animate}
              shape={sectorShape}
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
            >
              {showTotal && (
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null;
                    const cx = viewBox.cx ?? 0;
                    const cy = viewBox.cy ?? 0;
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={cx}
                          y={cy - 10}
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            fill: 'currentColor',
                          }}
                        >
                          {visibleTotal.toLocaleString()}
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 16}
                          style={{
                            fontSize: 12,
                            fill: 'var(--muted-foreground)',
                          }}
                        >
                          {totalLabel}
                        </tspan>
                      </text>
                    );
                  }}
                />
              )}
            </Pie>
          </PieChart>
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

export const DonutChart = memo(DonutChartInner) as typeof DonutChartInner;
export default DonutChart;
