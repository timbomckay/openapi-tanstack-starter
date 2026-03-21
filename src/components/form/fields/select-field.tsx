import type React from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/hooks/form-context';

interface SelectItemOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  items: SelectItemOption[];
  required?: boolean;
  hint?: string;
  multiple?: boolean;
  hideLabel?: boolean;
}

function renderMultiValue(
  value: string[],
  items: SelectItemOption[],
): React.ReactNode {
  if (value.length === 0) {
    return <span className="text-muted-foreground">Select options…</span>;
  }
  const firstLabel = items.find((i) => i.value === value[0])?.label ?? value[0];
  return value.length > 1
    ? `${firstLabel} (+${value.length - 1} more)`
    : firstLabel;
}

export function SelectField({
  label,
  items,
  required,
  hint,
  multiple,
  hideLabel,
}: SelectFieldProps) {
  const errors = useFieldContext<string | string[]>()
    .state.meta.errors.filter(Boolean)
    .map((e) => ({ message: String(e) }));

  if (multiple) {
    return (
      <MultiSelect
        label={label}
        items={items}
        required={required}
        hint={hint}
        errors={errors}
        hideLabel={hideLabel}
      />
    );
  }

  return (
    <SingleSelect
      label={label}
      items={items}
      required={required}
      hint={hint}
      errors={errors}
      hideLabel={hideLabel}
    />
  );
}

// ── Single ────────────────────────────────────────────────────────────────────

interface InnerProps {
  label: string;
  items: SelectItemOption[];
  required?: boolean;
  hint?: string;
  errors: { message: string }[];
  hideLabel?: boolean;
}

function SingleSelect({
  label,
  items,
  required,
  hint,
  errors,
  hideLabel,
}: InnerProps) {
  const field = useFieldContext<string>();
  const selectedLabel = items.find((i) => i.value === field.state.value)?.label;

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel
        htmlFor={field.name}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Select
        value={field.state.value}
        onValueChange={(v) => {
          if (v) field.handleChange(v);
        }}
      >
        <SelectTrigger id={field.name} aria-invalid={errors.length > 0}>
          <SelectValue>
            {selectedLabel ?? (
              <span className="text-muted-foreground">Select an option…</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}

// ── Multiple ──────────────────────────────────────────────────────────────────

function MultiSelect({
  label,
  items,
  required,
  hint,
  errors,
  hideLabel,
}: InnerProps) {
  const field = useFieldContext<string[]>();
  const value = field.state.value ?? [];

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel className={hideLabel ? 'sr-only' : undefined}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Select
        multiple
        value={value}
        onValueChange={(v: any) => field.handleChange(v as string[])}
      >
        <SelectTrigger aria-invalid={errors.length > 0}>
          <SelectValue>{renderMultiValue(value, items)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
