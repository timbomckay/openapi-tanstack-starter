import * as z from 'zod';

import type { ChartConfig } from '@/components/ui/chart';

import type { ColorMap, KeysSource, LabelMap } from './types';

// ---------------------------------------------------------------------------
// Default colour palette — distinct oklch values, readable in both themes
// ---------------------------------------------------------------------------

const DEFAULT_PALETTE = [
  'oklch(0.65 0.18 150)', // green
  'oklch(0.75 0.16 75)', // amber
  'oklch(0.60 0.16 255)', // indigo
  'oklch(0.65 0.18 320)', // pink/violet
  'oklch(0.70 0.15 200)', // teal
  'oklch(0.65 0.18 30)', // orange
  'oklch(0.65 0.16 280)', // purple
  'oklch(0.70 0.14 170)', // cyan
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitises a raw value string into a valid CSS custom-property key segment.
 * e.g. "in stock" → "in-stock", "2xl" → "_2xl"
 */
export function toCssKey(value: string): string {
  const slug = value.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9_-]/g, '');
  // CSS identifiers cannot start with a digit
  return /^\d/.test(slug) ? `_${slug}` : slug || '_unknown';
}

/**
 * Resolves a `KeysSource` to an ordered string array, or returns null if no
 * source was provided (caller falls back to data-derived keys).
 *
 * - `string[]` → returned as-is
 * - `ZodType`  → unwraps optional/nullable/default wrappers and extracts
 *   enum options; returns null for non-enum Zod types
 */
function resolveKeys(keys: KeysSource | undefined): string[] | null {
  if (!keys) return null;
  if (Array.isArray(keys)) return keys;

  // Unwrap optional / nullable / default wrappers
  let inner: z.ZodType = keys;
  while (
    inner instanceof z.ZodOptional ||
    inner instanceof z.ZodNullable ||
    inner instanceof z.ZodDefault
  ) {
    inner = inner.unwrap() as z.ZodType;
  }

  if (inner instanceof z.ZodEnum) {
    return inner.options as string[];
  }

  return null;
}

// ---------------------------------------------------------------------------
// buildDistributionData
// ---------------------------------------------------------------------------

export interface DistributionDataResult {
  /** One entry per unique value — { key, cssKey, count, fill }. */
  chartData: { key: string; cssKey: string; count: number; fill: string }[];
  /** shadcn ChartConfig, keyed by cssKey. */
  chartConfig: ChartConfig;
  /** Sum of all counts. */
  total: number;
}

/**
 * Builds `chartData` + `chartConfig` for Recharts / shadcn from either:
 * - Raw rows + a field name (the function counts occurrences), or
 * - A pre-aggregated `{ key: count }` map.
 *
 * When `schema` is supplied and the field is a ZodEnum, the enum options
 * drive the key set (preserving declared order; zero-count values included).
 * Raw values are sanitised to CSS-safe keys for `--color-*` variables.
 */
export function buildDistributionData(
  source:
    | { data: Record<string, unknown>[]; field: string; counts?: never }
    | { counts: Record<string, number>; data?: never; field?: never },
  opts: {
    keys?: KeysSource;
    colors?: ColorMap;
    labels?: LabelMap;
  } = {},
): DistributionDataResult {
  const { keys, colors = {}, labels = {} } = opts;

  // Build a counts map from whichever source was supplied
  let counts: Map<string, number>;
  if (source.counts) {
    counts = new Map(Object.entries(source.counts));
  } else {
    counts = new Map<string, number>();
    for (const row of source.data) {
      const val = String(row[source.field] ?? 'unknown');
      counts.set(val, (counts.get(val) ?? 0) + 1);
    }
  }

  // Key order: resolved keys take precedence (guarantees zero-count rows)
  const resolvedKeys = resolveKeys(keys) ?? Array.from(counts.keys());

  // Build config + data
  const chartConfig: ChartConfig = {};
  const chartData: DistributionDataResult['chartData'] = [];

  resolvedKeys.forEach((key, i) => {
    const cssKey = toCssKey(key);
    const color = colors[key] ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
    const label = labels[key] ?? key.charAt(0).toUpperCase() + key.slice(1);

    chartConfig[cssKey] = { label, color };
    chartData.push({
      key,
      cssKey,
      count: counts.get(key) ?? 0,
      fill: `var(--color-${cssKey})`,
    });
  });

  const total = chartData.reduce((s, d) => s + d.count, 0);

  return { chartData, chartConfig, total };
}
