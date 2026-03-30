import { memo, useMemo } from 'react';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

import type { TimeSeriesChartProps } from './types';

import { toCssKey } from './utils';

const DEFAULT_COLOR = 'oklch(0.65 0.18 150)';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LineChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> extends TimeSeriesChartProps<T> {
  /** Render as a filled area chart instead of a plain line. Default false. */
  area?: boolean;
  /** Show dots at each data point. Default false. */
  dots?: boolean;
  /** Approximate height of the chart area in px. Default 240. */
  chartHeight?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function LineChartInner<T extends Record<string, unknown>>({
  data,
  x,
  y,
  title,
  className,
  color = DEFAULT_COLOR,
  area = false,
  dots = false,
  chartHeight = 240,
  animate = false,
}: LineChartProps<T>) {
  const cssKey = toCssKey(y);
  const chartConfig = useMemo(
    () => ({
      [cssKey]: { label: y.charAt(0).toUpperCase() + y.slice(1), color },
    }),
    [cssKey, y, color],
  );

  const dot = dots ? undefined : false;
  const strokeVar = `var(--color-${cssKey})`;

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-0">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ChartContainer
          config={chartConfig}
          style={{ height: chartHeight }}
          className="w-full"
        >
          {area ? (
            <AreaChart data={data as Record<string, unknown>[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x as string} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey={y as string}
                stroke={strokeVar}
                fill={strokeVar}
                fillOpacity={0.15}
                dot={dot}
                isAnimationActive={animate}
              />
            </AreaChart>
          ) : (
            <RechartsLineChart data={data as Record<string, unknown>[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x as string} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey={y as string}
                stroke={strokeVar}
                dot={dot}
                isAnimationActive={animate}
              />
            </RechartsLineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const LineChart = memo(LineChartInner) as typeof LineChartInner;
export default LineChart;
