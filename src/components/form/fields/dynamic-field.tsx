import type { FieldDef, FieldOption } from '../field-def';

import { CheckboxGroupField } from './checkbox-group-field';
import { DateField } from './date-field';
import { RadioGroupField } from './radio-group-field';
import { SelectField } from './select-field';
import { TextField } from './text-field';
import { TextareaField } from './textarea-field';

/** Resolves the control type from a FieldDef. Bakes in the intelligence layer. */
function resolveType(
  field: FieldDef,
  threshold: number,
): NonNullable<FieldDef['type']> {
  if (field.type) return field.type;
  if (field.options) {
    if (field.options.length > threshold) return 'select';
    return field.multiple ? 'checkbox' : 'radio';
  }
  return 'text';
}

function normalizeOptions(options: FieldDef['options']): FieldOption[] {
  if (!options) return [];
  return options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );
}

interface DynamicFieldProps {
  field: FieldDef;
  /** Options count threshold for radio → select promotion. Defaults to 6. */
  threshold?: number;
}

/**
 * Registered field component that resolves the correct control from a FieldDef
 * and delegates to the appropriate field component. The field context is provided
 * by the parent form.AppField — no need to call useFieldContext here.
 */
export function DynamicField({ field, threshold = 6 }: DynamicFieldProps) {
  const resolvedType = resolveType(field, threshold);
  const options = normalizeOptions(field.options);
  const {
    label = '',
    hint,
    placeholder,
    disabled,
    hideLabel,
    readonly,
  } = field;

  // Suppress required marker for readonly fields — they can't be filled in
  const required = field.readonly ? undefined : field.required;

  switch (resolvedType) {
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
    default:
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
  }
}
