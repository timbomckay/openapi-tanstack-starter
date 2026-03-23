import type { FieldDef, FieldOption } from '../field-def';

import { CheckboxGroupField } from './checkbox-group-field';
import { ComboboxField } from './combobox-field';
import { DateField } from './date-field';
import { FileField } from './file-field';
import { RadioGroupField } from './radio-group-field';
import { SelectField } from './select-field';
import { SwitchField } from './switch-field';
import { TextField } from './text-field';
import { TextareaField } from './textarea-field';

/** Compile-time exhaustiveness check — errors if a FieldType case is unhandled. */
function assertNever(x: never): never {
  throw new Error(`Unhandled field type: ${String(x)}`);
}

function normalizeOptions(options: FieldOption[] | string[]): FieldOption[] {
  return options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );
}

/**
 * Resolves the control type from a FieldDef + its resolved options.
 *
 * - Explicit `type` always wins.
 * - options present (static or function — function is called before this):
 *   - count > comboboxThreshold → `combobox` (searchable)
 *   - count > threshold         → `select`
 *   - count <= threshold        → `radio` / `checkbox` (all options visible)
 * - No options: `text`.
 */
function resolveType(
  field: FieldDef,
  resolvedOptions: FieldOption[],
  threshold: number,
  comboboxThreshold: number,
): NonNullable<FieldDef['type']> {
  if (field.type) return field.type;
  if (field.options) {
    if (resolvedOptions.length > comboboxThreshold) return 'combobox';
    if (resolvedOptions.length > threshold) return 'select';
    return field.multiple ? 'checkbox' : 'radio';
  }
  return 'text';
}

interface DynamicFieldProps {
  field: FieldDef;
  /** Options count threshold for radio → select promotion. Defaults to 6. */
  threshold?: number;
  /**
   * Options count threshold for select → combobox promotion.
   * Defaults to `threshold * 4`. Prefer setting this via FormBuilder which
   * computes the multiplier default once and passes the resolved value down.
   */
  comboboxThreshold?: number;
}

/**
 * Registered field component that resolves the correct control from a FieldDef
 * and delegates to the appropriate field component. The field context is provided
 * by the parent form.AppField — no need to call useFieldContext here.
 */
export function DynamicField({
  field,
  threshold = 6,
  comboboxThreshold,
}: DynamicFieldProps) {
  const rawOptions =
    typeof field.options === 'function' ? field.options() : field.options;
  const options = rawOptions ? normalizeOptions(rawOptions) : [];
  const resolvedComboboxThreshold = comboboxThreshold ?? threshold * 4;
  const resolvedType = resolveType(
    field,
    options,
    threshold,
    resolvedComboboxThreshold,
  );
  const {
    label = '',
    hint,
    placeholder,
    disabled,
    hideLabel,
    readonly,
    maxSelections,
    accept,
  } = field;

  // Suppress required marker for readonly fields — they can't be filled in
  const required = field.readonly ? undefined : field.required;

  switch (resolvedType) {
    case 'text':
    case 'email':
    case 'tel':
    case 'number':
    case 'password':
      return (
        <TextField
          label={label}
          type={resolvedType}
          placeholder={placeholder}
          required={required}
          hint={hint}
          disabled={disabled}
          hideLabel={hideLabel}
          readonly={readonly}
        />
      );
    case 'textarea':
      return (
        <TextareaField
          label={label}
          placeholder={placeholder}
          required={required}
          hint={hint}
          hideLabel={hideLabel}
          readonly={readonly}
        />
      );
    case 'radio':
      return (
        <RadioGroupField
          label={label}
          options={options}
          required={required}
          hint={hint}
          hideLabel={hideLabel}
        />
      );
    case 'checkbox':
      return (
        <CheckboxGroupField
          label={label}
          options={options}
          required={required}
          hint={hint}
          hideLabel={hideLabel}
          maxSelections={maxSelections}
        />
      );
    case 'combobox':
      return (
        <ComboboxField
          label={label}
          items={options}
          required={required}
          hint={hint}
          multiple={field.multiple}
          placeholder={placeholder}
          hideLabel={hideLabel}
          maxSelections={maxSelections}
        />
      );
    case 'select':
      return (
        <SelectField
          label={label}
          items={options}
          required={required}
          hint={hint}
          multiple={field.multiple}
          hideLabel={hideLabel}
          maxSelections={maxSelections}
        />
      );
    case 'switch':
      return (
        <SwitchField
          label={label}
          hint={hint}
          required={required}
          disabled={disabled}
          hideLabel={hideLabel}
        />
      );
    case 'date':
      return (
        <DateField
          label={label}
          required={required}
          hint={hint}
          readonly={readonly}
          hideLabel={hideLabel}
        />
      );
    case 'file':
      return (
        <FileField
          label={label}
          required={required}
          hint={hint}
          hideLabel={hideLabel}
          accept={accept}
          multiple={field.multiple}
        />
      );
    case 'hidden':
      // Hidden fields carry a value through form state without rendering anything.
      return null;
    case 'repeater':
      // Repeater is handled upstream by FormBuilder (needs mode="array" + form instance).
      // DynamicField should never be asked to render one directly.
      return null;
    default:
      return assertNever(resolvedType);
  }
}
