// Unified lazy-dispatch component — single entry point
export { Chart } from './chart';

// Individual chart components — import directly for full generic type safety
export { DonutChart } from './donut-chart';
export type { DonutChartProps } from './donut-chart';

export { BarChart } from './bar-chart';
export type { BarChartProps } from './bar-chart';

export { LineChart } from './line-chart';
export type { LineChartProps } from './line-chart';

export { RadarChart } from './radar-chart';
export type { RadarChartProps } from './radar-chart';

export { RadialChart } from './radial-chart';
export type { RadialChartProps } from './radial-chart';

// Shared types
export type {
  ChartProps,
  DistributionChartProps,
  TimeSeriesChartProps,
  ColorMap,
  LabelMap,
} from './types';
