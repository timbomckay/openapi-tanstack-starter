import type React from 'react';

import type {
  CellContext,
  ColumnDef,
  HeaderContext,
} from '@tanstack/react-table';

import * as z from 'zod';

import {
  badgeCell,
  badgesCell,
  booleanCell,
  dateCell,
  makeBadgeCell,
  makeBadgesCell,
  monoCell,
  numberCell,
  textCell,
  type BadgeMap,
} from './cell-renderers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnyZodType = z.ZodType;

/**
 * The cell renderer types available out of the box.
 *
 * | Type      | Renders                                          |
 * |-----------|--------------------------------------------------|
 * | text      | Plain string                                     |
 * | number    | Locale-formatted number, tabular figures         |
 * | mono      | Monospace text for IDs / codes                   |
 * | boolean   | Check icon (true) or em dash (false / null)      |
 * | badge     | Single outline Badge, value auto-capitalized     |
 * | badges    | Pill list (max 3 visible + overflow count)       |
 * | date      | toLocaleDateString()                             |
 */
export type CellType =
  | 'text'
  | 'number'
  | 'mono'
  | 'boolean'
  | 'badge'
  | 'badges'
  | 'date';

/**
 * Per-column customisation passed to `zodToColumns`.
 *
 * - `false`     — exclude this column entirely
 * - object      — override any inferred property; all keys are optional
 *
 * Supply `cell` to take full control of the cell renderer, or `cellType` to
 * swap the renderer while keeping everything else inferred.
 */
export type ColumnOverride<TData> =
  | false
  | {
      /** Replaces the auto-derived "Title Case" header string. */
      header?:
        | string
        | ((ctx: HeaderContext<TData, unknown>) => React.ReactNode);
      /** Full cell renderer — overrides both `cellType` and the inferred renderer. */
      cell?: (ctx: CellContext<TData, unknown>) => React.ReactNode;
      /** Swap the inferred cell renderer without writing a full `cell` function. */
      cellType?: CellType;
      /**
       * Declarative per-value customisation for `badge` cells.
       * Applies when `cellType` is (or infers to) `'badge'`.
       * Generates a cell renderer automatically — no need for a custom `cell` function.
       *
       * @example
       * ```ts
       * status: {
       *   badge: {
       *     variants: { available: 'default', pending: 'secondary', sold: 'destructive' },
       *     icons:    { available: CheckCircleIcon, sold: XCircleIcon },
       *   },
       * }
       * ```
       */
      badge?: BadgeMap;
      /**
       * Declarative per-value customisation for `badges` (array) cells.
       * Applies when `cellType` is (or infers to) `'badges'`.
       */
      badges?: BadgeMap;
      /**
       * When true, this column expands to fill all remaining horizontal space.
       * All other columns shrink to fit their content width.
       * Only one column should have `grow: true` per table.
       */
      grow?: boolean;
      enableSorting?: boolean;
      enableColumnFilter?: boolean;
      size?: number;
      minSize?: number;
      maxSize?: number;
      meta?: Record<string, unknown>;
    };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function labelFromName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function unwrap(schema: AnyZodType): { inner: AnyZodType; optional: boolean } {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return { inner: schema.unwrap() as AnyZodType, optional: true };
  }
  if (schema instanceof z.ZodDefault) {
    return { inner: schema.unwrap() as AnyZodType, optional: true };
  }
  return { inner: schema, optional: false };
}

type Inferred = { cellType: CellType; enableSorting: boolean };

function inferColumn(inner: AnyZodType): Inferred | null {
  if (inner instanceof z.ZodString) {
    const fmt = (inner as z.ZodString).format;
    if (fmt === 'datetime' || fmt === 'date')
      return { cellType: 'date', enableSorting: true };
    return { cellType: 'text', enableSorting: true };
  }
  if (inner instanceof z.ZodNumber) {
    return { cellType: 'number', enableSorting: true };
  }
  if (inner instanceof z.ZodBigInt) {
    // BigInt fields are almost always generated IDs — mono renders them clearly.
    return { cellType: 'mono', enableSorting: true };
  }
  if (inner instanceof z.ZodBoolean) {
    return { cellType: 'boolean', enableSorting: false };
  }
  if (inner instanceof z.ZodEnum) {
    return { cellType: 'badge', enableSorting: true };
  }
  if (inner instanceof z.ZodArray) {
    const elem = (inner as z.ZodArray<AnyZodType>).element;
    const { inner: elemInner } = unwrap(elem as AnyZodType);
    if (
      elemInner instanceof z.ZodString ||
      elemInner instanceof z.ZodNumber ||
      elemInner instanceof z.ZodEnum ||
      // Object arrays: render via badgesCell which reads .name by convention
      elemInner instanceof z.ZodObject
    ) {
      return { cellType: 'badges', enableSorting: false };
    }
    return null;
  }
  return null;
}

const renderers: Record<
  CellType,
  (ctx: CellContext<unknown, unknown>) => React.ReactNode
> = {
  text: textCell,
  number: numberCell,
  mono: monoCell,
  boolean: booleanCell,
  badge: badgeCell,
  badges: badgesCell,
  date: dateCell,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Derives a `ColumnDef[]` array from a Zod object schema, ready to pass
 * directly to `<DataTable columns={columns} />`.
 *
 * **What is inferred automatically:**
 * - Header label from camelCase key ("photoUrl" → "Photo Url")
 * - Cell renderer from Zod type (string→text, enum→badge, ZodArray→badges, …)
 * - `enableSorting` (true for scalar types, false for arrays / booleans)
 *
 * **What requires overrides:**
 * - Custom cell renderers (e.g. coloured badges, action buttons, links)
 * - Better header labels ("photoUrl" → "Photo URL")
 * - Column sizing / filter settings
 * - Hiding a column (`false`)
 * - ZodObject columns (always skipped unless you supply `cell`)
 *
 * @example
 * ```ts
 * const columns = zodToColumns(zPet, {
 *   id:     { cellType: 'mono', header: 'ID' },
 *   status: { cell: ({ row }) => <StatusBadge status={row.original.status} /> },
 *   tags:   false,
 * });
 *
 * <DataTable columns={columns} data={pets} isLoading={isLoading} />
 * ```
 */
export function zodToColumns<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  overrides?: { [K in keyof T]?: ColumnOverride<z.infer<z.ZodObject<T>>> },
): ColumnDef<z.infer<z.ZodObject<T>>>[] {
  type TData = z.infer<z.ZodObject<T>>;

  const shape = schema.shape as z.ZodRawShape;
  const columns: ColumnDef<TData>[] = [];

  for (const [name, rawSchema] of Object.entries(shape)) {
    const override = overrides?.[name as keyof T];

    if (override === false) continue;

    const { inner } = unwrap(rawSchema as AnyZodType);
    const inferred = inferColumn(inner);

    // ZodObject and unhandled types are skipped unless the caller provides a
    // cell renderer — complex nested objects need custom presentation.
    if (inferred === null && !override?.cell && !override?.cellType) continue;

    const cellType: CellType =
      override?.cellType ?? inferred?.cellType ?? 'text';
    const enableSorting =
      override?.enableSorting ?? inferred?.enableSorting ?? false;

    const {
      cellType: _ct,
      badge: badgeMap,
      badges: badgesMap,
      grow,
      ...rest
    } = (override ?? {}) as Omit<
      Exclude<ColumnOverride<TData>, false>,
      never
    > & {
      cellType?: CellType;
      badge?: BadgeMap;
      badges?: BadgeMap;
      grow?: boolean;
    };

    // Prefer factory renderers when a BadgeMap is supplied; fall back to defaults.
    const cellRenderer =
      badgeMap && cellType === 'badge'
        ? makeBadgeCell(badgeMap)
        : badgesMap && cellType === 'badges'
          ? makeBadgesCell(badgesMap)
          : renderers[cellType];

    const column: ColumnDef<TData> = {
      accessorKey: name,
      header: labelFromName(name),
      enableSorting,
      // Cast: cell renderers are generic over TData; the narrowed TData here is compatible.
      cell: cellRenderer as ColumnDef<TData>['cell'],
      ...(grow ? { meta: { ...rest.meta, grow: true } } : {}),
      ...rest,
    };

    columns.push(column);
  }

  return columns;
}
