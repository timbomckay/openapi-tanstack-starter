import * as z from 'zod';

import type { FieldDef } from './field-def';

// In Zod v4, ZodType is the common base class for all schemas
type AnyZodType = z.ZodType;

/** Convert camelCase / snake_case to "Title Case" */
function labelFromName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** Unwrap ZodOptional / ZodNullable / ZodDefault to get the inner type */
function unwrap(schema: AnyZodType): { inner: AnyZodType; optional: boolean } {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    // Cast: unwrap() returns the inner $ZodType which is a ZodType at runtime
    return { inner: schema.unwrap() as AnyZodType, optional: true };
  }
  if (schema instanceof z.ZodDefault) {
    return { inner: schema.unwrap() as AnyZodType, optional: true };
  }
  return { inner: schema, optional: false };
}

type InferredProps = Pick<
  FieldDef,
  'type' | 'options' | 'multiple' | 'defaultValue' | 'fields'
>;

/**
 * Extract the max length constraint from a ZodArray if present.
 * Zod v4 stores constraints in `_def.checks[n]._zod.def`.
 */
function arrayMaxLength(schema: AnyZodType): number | undefined {
  if (!(schema instanceof z.ZodArray)) return undefined;
  const checks = ((schema as z.ZodArray<AnyZodType>)._def.checks ??
    []) as Array<{
    _zod?: { def?: { check?: string; maximum?: number } };
  }>;
  return checks.find((c) => c._zod?.def?.check === 'max_length')?._zod?.def
    ?.maximum;
}

/** Map a Zod inner type to FieldDef props. Returns null to skip unsupported types. */
function inferProps(
  inner: AnyZodType,
  optional: boolean,
): InferredProps | null {
  if (inner instanceof z.ZodString) {
    // ZodString exposes a `format` property: 'email' | 'url' | 'datetime' | 'date' | null
    const format = (inner as z.ZodString).format;
    if (format === 'email') return { type: 'email', defaultValue: '' };
    if (format === 'datetime' || format === 'date')
      return { type: 'date', defaultValue: '' };
    return { type: 'text', defaultValue: '' };
  }

  if (inner instanceof z.ZodBoolean) {
    return { type: 'switch', defaultValue: optional ? undefined : false };
  }

  if (inner instanceof z.ZodNumber) {
    return { type: 'number', defaultValue: optional ? undefined : 0 };
  }

  if (inner instanceof z.ZodBigInt) {
    // int64 fields (server-generated IDs) — hidden by default, no UI rendered.
    // Override defaultValue when editing: id: { defaultValue: record.id }
    return { type: 'hidden', defaultValue: undefined };
  }

  if (inner instanceof z.ZodEnum) {
    const values = (inner as z.ZodEnum).options as string[];
    // Auto-capitalize option labels (e.g. "available" → "Available")
    const options = values.map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    }));
    return { options, defaultValue: optional ? undefined : values[0] };
  }

  if (inner instanceof z.ZodObject) {
    const subFields = zodToFields(inner as z.ZodObject<z.ZodRawShape>);
    if (subFields.length === 0) return null;
    const defaultValue = Object.fromEntries(
      subFields.map((sf) => [
        sf.name,
        sf.defaultValue ?? (sf.multiple ? [] : ''),
      ]),
    );
    return { type: 'group', defaultValue, fields: subFields };
  }

  if (inner instanceof z.ZodArray) {
    const elemSchema = (inner as z.ZodArray<AnyZodType>).element;
    const { inner: elemInner, optional: elemOptional } = unwrap(
      elemSchema as AnyZodType,
    );

    // Object array — recursively derive a FieldDef per property
    if (elemInner instanceof z.ZodObject) {
      return {
        type: 'repeater',
        defaultValue: [],
        fields: zodToFields(elemInner as z.ZodObject<z.ZodRawShape>),
      };
    }

    // Scalar string or number — single child with name='' (item IS the value)
    const scalarType: FieldDef['type'] | null =
      elemInner instanceof z.ZodString
        ? (((elemInner as z.ZodString).format as FieldDef['type'] | null) ??
          'text')
        : elemInner instanceof z.ZodNumber
          ? 'number'
          : null;

    if (scalarType !== null) {
      return {
        type: 'repeater',
        defaultValue: [],
        fields: [
          {
            name: '',
            label: 'Item',
            hideLabel: true,
            type: scalarType,
            required: !elemOptional,
            defaultValue:
              scalarType === 'number' ? (elemOptional ? undefined : 0) : '',
            validators: {
              onChange: ({ value }) => {
                const result = (elemSchema as AnyZodType).safeParse(value);
                return result.success
                  ? undefined
                  : result.error.issues[0]?.message;
              },
            },
          },
        ],
      };
    }

    return null; // Array<union>, Array<tuple>, etc. → skip
  }

  // Everything else (ZodBoolean, ZodBigInt, ZodObject, ZodUnion,
  // ZodPipe, ZodTransform, etc.) → skip unless the caller provides explicit overrides
  return null;
}

export type FieldOverride = Partial<FieldDef> & {
  /**
   * Set to true to exclude this field from the output entirely.
   * Useful for skipping generated ID fields, nested objects, or arrays.
   */
  skip?: boolean;
};

/**
 * Derives a FieldDef array from a Zod object schema.
 *
 * What is inferred automatically:
 * - Control type (string→text, enum→radio/select, number→number, email format→email)
 * - Required / optional from .optional() / .nullable()
 * - Options for enum fields (auto-capitalized labels)
 * - Default values (empty string, 0, first enum value, undefined for optionals)
 * - onChange validators wired directly to each field's Zod schema
 * - Labels derived from camelCase field names ("photoUrl" → "Photo Url")
 *
 * What requires overrides:
 * - Placeholders and hints (not in Zod)
 * - Better labels ("photoUrl" → "Photo URL")
 * - Complex types (union, array, object) — skip or provide explicit type/options
 * - Fields you don't want in the form (e.g. generated ID fields) — use skip: true
 *
 * Integrates with useFieldForm + FormBuilder + DynamicField out of the box:
 * @example
 * const fields = zodToFields(mySchema, {
 *   id: { skip: true },
 *   name: { placeholder: 'Fluffy' },
 *   photoUrl: { type: 'text', label: 'Photo URL' }, // union type needs explicit type
 * });
 * const form = useFieldForm({ fields, onSubmit: ({ value }) => … });
 * return <FormBuilder form={form} fields={fields} />;
 */
export function zodToFields<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  overrides?: { [K in keyof T]?: FieldOverride },
): FieldDef[] {
  const shape = schema.shape as z.ZodRawShape;
  const fields: FieldDef[] = [];

  for (const [name, rawSchema] of Object.entries(shape)) {
    const override = overrides?.[name as keyof T];
    if (override?.skip) continue;

    const { inner, optional } = unwrap(rawSchema as AnyZodType);
    const inferred = inferProps(inner, optional);

    // Skip if we can't map the type and no explicit type/options override is provided
    if (inferred === null && !override?.type && !override?.options) continue;

    const { skip: _skip, ...rest } = override ?? {};

    // Auto-wire per-field Zod validation. The FormBuilder's composeValidator will
    // run the required-empty check first (for required fields), then this validator.
    const autoValidator: FieldDef['validators'] = {
      onChange: ({ value }) => {
        const result = (rawSchema as AnyZodType).safeParse(value);
        return result.success ? undefined : result.error.issues[0]?.message;
      },
    };

    // When an override supplies options (static or function) without an explicit
    // type, clear the inferred type and repeater fields so DynamicField can
    // resolve the correct control (radio/checkbox/select/combobox) from the
    // options rather than being locked in as a repeater.
    const inferredOverride =
      rest.options && !rest.type
        ? { ...inferred, type: undefined, fields: undefined }
        : inferred;

    const field: FieldDef = {
      name,
      label: labelFromName(name),
      required: !optional,
      ...inferredOverride,
      validators: autoValidator,
      // Spread overrides last so callers can replace any inferred property,
      // including validators (to swap out the auto-wired one entirely).
      ...rest,
    };

    // Infer maxSelections from ZodArray.max() for multi-option fields.
    // Only applies when options are present (i.e. not a repeater).
    if (
      inner instanceof z.ZodArray &&
      field.options != null &&
      field.maxSelections == null
    ) {
      const max = arrayMaxLength(inner);
      if (max != null) field.maxSelections = max;
    }

    fields.push(field);
  }

  return fields;
}
