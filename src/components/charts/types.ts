import type * as z from 'zod';

/**
 * Controls legend order and guarantees zero-count keys appear.
 *
 * - `string[]` — explicit key list in display order
 * - `z.ZodType` — any Zod field; enums (including optional-wrapped) are
 *   unwrapped automatically to extract their options.
 *   Pass a field directly: `keys={zPet.shape.status}`
 */
export type KeysSource = string[] | z.ZodType;

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type ColorMap = Record<string, string>;
export type LabelMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Distribution chart props (donut, pie, bar)
//
// "Distribution" = count how many rows have each unique value of `field`.
// ---------------------------------------------------------------------------

/**
 * Distribution chart props.
 *
 * Supply **either** `data + field` (raw rows — the component counts for you)
 * **or** `counts` (pre-aggregated `{ key: number }` map).
 */
export type DistributionChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> = DistributionChartBase &
  (
    | {
        /** Raw dataset — the component counts occurrences of `field`. */
        data: T[];
        /** Field whose distinct values are counted. */
        field: keyof T & string;
        counts?: never;
      }
    | {
        /**
         * Pre-aggregated counts — skips the counting step.
         * Useful when you already have summary data from an API.
         * @example { available: 372, pending: 116, sold: 0 }
         */
        counts: Record<string, number>;
        data?: never;
        field?: never;
      }
  );

interface DistributionChartBase {
  /**
   * Controls legend order and guarantees zero-count entries appear.
   *
   * - `string[]` — explicit key list in display order
   * - Zod field — pass a schema field directly; enum options are extracted
   *   automatically, optional/nullable wrappers are unwrapped.
   *
   * @example
   * keys={['available', 'pending', 'sold']}   // manual
   * keys={zPet.shape.status}                  // from Zod schema field
   */
  keys?: KeysSource;
  /** Per-value colour overrides. Falls back to the built-in palette. */
  colors?: ColorMap;
  /** Per-value display label overrides. Falls back to capitalised key. */
  labels?: LabelMap;
  /** Optional card title rendered above the chart. */
  title?: string;
  className?: string;
  /** Enable entry animation. Default false. */
  animate?: boolean;
  /**
   * Enable legend click-to-toggle and hover highlighting. Default true.
   * Set false for static/decorative charts.
   */
  interactive?: boolean;
  /** Called when a chart element (slice, bar, …) is clicked. */
  onValueClick?: (key: string, count: number) => void;
}

// ---------------------------------------------------------------------------
// Time-series chart props (line, area)
// ---------------------------------------------------------------------------

export interface TimeSeriesChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  data: T[];
  /** Field used for the X axis (typically a date/datetime string). */
  x: keyof T & string;
  /** Field used for the Y axis (a numeric value). */
  y: keyof T & string;
  title?: string;
  /** Line / fill colour. Defaults to the theme primary green. */
  color?: string;
  className?: string;
  /** Enable entry animation. Default false. */
  animate?: boolean;
}

// ---------------------------------------------------------------------------
// Discriminated union — used by the unified <Chart> dispatch component
// ---------------------------------------------------------------------------

export type ChartProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> =
  | ({
      type: 'donut' | 'pie';
      totalLabel?: string;
      showTotal?: boolean;
    } & DistributionChartProps<T>)
  | ({ type: 'bar' } & DistributionChartProps<T>)
  | ({ type: 'radar' } & DistributionChartProps<T>)
  | ({ type: 'radial' } & DistributionChartProps<T>)
  | ({ type: 'line' | 'area' } & TimeSeriesChartProps<T>);
