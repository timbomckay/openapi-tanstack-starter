import type React from 'react';

import type { CellContext } from '@tanstack/react-table';
import type { VariantProps } from 'class-variance-authority';

import { CheckIcon } from '@phosphor-icons/react';

import { type badgeVariants, Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// BadgeMap — declarative per-value customisation for badge / badges cells
// ---------------------------------------------------------------------------

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>['variant']
>;

/**
 * Maps each cell value to a badge variant, icon, and/or extra class.
 * Any key can be omitted — unmatched values fall back to the defaults.
 *
 * @example
 * ```ts
 * status: {
 *   badge: {
 *     variants: { available: 'default', pending: 'secondary', sold: 'destructive' },
 *     icons:    { available: CheckCircleIcon, sold: XCircleIcon },
 *     classes:  { pending: 'opacity-70' },
 *   },
 * }
 * ```
 */
export type BadgeMap = {
  /** Per-value Badge variant. Falls back to `'outline'` for unmatched values. */
  variants?: Record<string, BadgeVariant>;
  /** Per-value icon component (Phosphor or any `React.ElementType` accepting `className`). */
  icons?: Record<string, React.ElementType>;
  /** Per-value extra className appended to the Badge. */
  classes?: Record<string, string>;
  /** Fallback variant when a value has no entry in `variants`. Defaults to `'outline'`. */
  defaultVariant?: BadgeVariant;
};

const empty = <span className="text-muted-foreground/40">—</span>;

export function textCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (v == null || v === '') return empty;
  return <span>{String(v)}</span>;
}

export function numberCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (v == null) return empty;
  return <span className="tabular-nums">{Number(v).toLocaleString()}</span>;
}

export function monoCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (v == null) return empty;
  return (
    <span className="font-mono text-xs text-muted-foreground">{String(v)}</span>
  );
}

export function booleanCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (v == null) return empty;
  return v ? <CheckIcon className="size-4 text-primary" /> : empty;
}

export function badgeCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (v == null || v === '') return null;
  const label = String(v);
  return (
    <Badge variant="outline">
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  );
}

/** Factory: returns a badge cell renderer pre-configured with per-value maps. */
export function makeBadgeCell<TData>(map: BadgeMap) {
  return function ({ getValue }: CellContext<TData, unknown>) {
    const v = getValue();
    if (v == null || v === '') return null;
    const key = String(v);
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const variant = map.variants?.[key] ?? map.defaultVariant ?? 'outline';
    const Icon = map.icons?.[key];
    const cls = map.classes?.[key];
    return (
      <Badge variant={variant} className={cn(cls)}>
        {Icon && <Icon />}
        {label}
      </Badge>
    );
  };
}

export function badgesCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (!Array.isArray(v) || v.length === 0) return empty;
  const visible = v.slice(0, 3) as unknown[];
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item, i) => {
        const label =
          typeof item === 'object' && item !== null
            ? String(
                (item as Record<string, unknown>).name ?? JSON.stringify(item),
              )
            : String(item);
        return (
          <Badge key={i} variant="outline" className="text-xs">
            {label}
          </Badge>
        );
      })}
      {v.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{v.length - 3}
        </Badge>
      )}
    </div>
  );
}

/** Factory: returns a badges (array) cell renderer pre-configured with per-value maps. */
export function makeBadgesCell<TData>(map: BadgeMap) {
  return function ({ getValue }: CellContext<TData, unknown>) {
    const v = getValue();
    if (!Array.isArray(v) || v.length === 0) return empty;
    const visible = v.slice(0, 3) as unknown[];
    return (
      <div className="flex flex-wrap gap-1">
        {visible.map((item, i) => {
          const key =
            typeof item === 'object' && item !== null
              ? String(
                  (item as Record<string, unknown>).name ??
                    JSON.stringify(item),
                )
              : String(item);
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          const variant =
            map.variants?.[key] ?? map.defaultVariant ?? 'outline';
          const Icon = map.icons?.[key];
          const cls = map.classes?.[key];
          return (
            <Badge key={i} variant={variant} className={cn('text-xs', cls)}>
              {Icon && <Icon />}
              {label}
            </Badge>
          );
        })}
        {v.length > 3 && (
          <Badge variant={map.defaultVariant ?? 'outline'} className="text-xs">
            +{v.length - 3}
          </Badge>
        )}
      </div>
    );
  };
}

export function dateCell<TData>({ getValue }: CellContext<TData, unknown>) {
  const v = getValue();
  if (v == null || v === '') return empty;
  try {
    return (
      <span className="text-sm">
        {new Date(String(v)).toLocaleDateString()}
      </span>
    );
  } catch {
    return <span>{String(v)}</span>;
  }
}
