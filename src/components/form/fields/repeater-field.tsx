import type { ReactNode } from 'react';

import { MinusIcon, PlusIcon } from '@phosphor-icons/react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { useFieldContext } from '@/hooks/form-context';

import type { FieldDef } from '../field-def';

import { DynamicField } from './dynamic-field';

/** Minimal form interface needed by RepeaterField to render sub-fields. */
interface FormWithField {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AppField: (props: any) => ReactNode | Promise<ReactNode>;
}

interface RepeaterFieldProps {
  field: FieldDef;
  /** Form instance from FormBuilder — needed to render per-item sub-fields. */
  form: FormWithField;
}

/** Composes a required-empty check with an optional custom validator. */
function composeOnChange(
  required: boolean | undefined,
  custom: ((ctx: { value: unknown }) => string | undefined) | undefined,
): ((ctx: { value: unknown }) => string | undefined) | undefined {
  const isEmpty = (v: unknown) => v == null || v === '';
  if (!required && !custom) return undefined;
  if (required && custom)
    return (ctx) => (isEmpty(ctx.value) ? 'Required' : custom(ctx));
  if (required) return (ctx) => (isEmpty(ctx.value) ? 'Required' : undefined);
  return custom;
}

/**
 * Renders an array field as a list of rows with add/remove controls.
 *
 * Each row renders every child FieldDef via form.AppField + DynamicField.
 * - Single child with name='' → scalar array (string[], number[]): item IS the value,
 *   bound to fieldName[i]. Rendered inline with a remove icon button.
 * - Multiple or named children → object array: each property bound to fieldName[i].propName.
 *   Rendered in a bordered card with a remove button at the bottom.
 *
 * Must be rendered inside form.AppField with mode="array".
 * The `form` prop is passed explicitly because AppField does not set formContext.
 */
export function RepeaterField({ field: fieldDef, form }: RepeaterFieldProps) {
  const field = useFieldContext<unknown[]>();
  const items = field.state.value ?? [];
  const errors = field.state.meta.errors
    .filter(Boolean)
    .map((e) => ({ message: String(e) }));

  const { label = '', required, hint, fields = [], addLabel } = fieldDef;

  const isMultiField =
    fields.length > 1 || (fields.length === 1 && fields[0].name !== '');

  // Derive empty item for pushValue
  const emptyItem: unknown = isMultiField
    ? Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? '']))
    : fields[0]?.type === 'number'
      ? 0
      : '';

  const buttonLabel =
    addLabel ?? (label ? `Add ${label.toLowerCase()}` : 'Add item');

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      {label && (
        <FieldLabel>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </FieldLabel>
      )}
      <div className="space-y-2">
        {items.map((_, i) => {
          const subFields = fields.map((subFieldDef) => {
            const onChange = composeOnChange(
              subFieldDef.required,
              subFieldDef.validators?.onChange,
            );
            // Scalar child (name='') binds directly to the array index; named children use dot notation
            const name = subFieldDef.name
              ? `${field.name}[${i}].${subFieldDef.name}`
              : `${field.name}[${i}]`;
            // For scalar children, inject the 1-based index into the label so screen readers
            // (and optionally sighted users) get "Item 1", "Item 2", etc.
            const resolvedField =
              subFieldDef.name === ''
                ? { ...subFieldDef, label: `Item ${i + 1}` }
                : subFieldDef;
            return (
              <form.AppField
                key={subFieldDef.name || '__item'}
                name={name as never}
                validators={onChange ? { onChange } : undefined}
              >
                {() => <DynamicField field={resolvedField} />}
              </form.AppField>
            );
          });

          return isMultiField ? (
            // Object mode: bordered card with fields in a grid, remove at bottom
            <div key={i} className="space-y-3 rounded-lg border p-3">
              <div className="grid gap-3 sm:grid-cols-2">{subFields}</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => field.removeValue(i)}
              >
                <MinusIcon className="mr-1 size-4" />
                Remove
              </Button>
            </div>
          ) : (
            // Single-field mode: input inline with a remove icon button
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">{subFields}</div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove"
                className="mb-0.5"
                onClick={() => field.removeValue(i)}
              >
                <MinusIcon className="size-4" />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => field.pushValue(emptyItem as never)}
        >
          <PlusIcon className="mr-1 size-4" />
          {buttonLabel}
        </Button>
      </div>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
