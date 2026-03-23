import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { useFieldContext } from '@/hooks/form-context';

import type { FieldOption } from '../field-def';

interface ComboboxFieldProps {
  label: string;
  items: FieldOption[];
  required?: boolean;
  hint?: string;
  hideLabel?: boolean;
  multiple?: boolean;
  placeholder?: string;
  maxSelections?: number;
}

export function ComboboxField({
  label,
  items,
  required,
  hint,
  hideLabel,
  multiple,
  placeholder,
  maxSelections,
}: ComboboxFieldProps) {
  const errors = useFieldContext<string | string[]>()
    .state.meta.errors.filter(Boolean)
    .map((e) => ({ message: String(e) }));

  if (multiple) {
    return (
      <MultiCombobox
        label={label}
        items={items}
        required={required}
        hint={hint}
        hideLabel={hideLabel}
        errors={errors}
        placeholder={placeholder}
        maxSelections={maxSelections}
      />
    );
  }

  return (
    <SingleCombobox
      label={label}
      items={items}
      required={required}
      hint={hint}
      hideLabel={hideLabel}
      errors={errors}
      placeholder={placeholder}
    />
  );
}

// ── Shared inner props ─────────────────────────────────────────────────────────

interface InnerProps {
  label: string;
  items: FieldOption[];
  required?: boolean;
  hint?: string;
  hideLabel?: boolean;
  errors: { message: string }[];
  placeholder?: string;
  maxSelections?: number;
}

// ── Single ─────────────────────────────────────────────────────────────────────

function SingleCombobox({
  label,
  items,
  required,
  hint,
  hideLabel,
  errors,
  placeholder,
}: InnerProps) {
  const field = useFieldContext<string>();

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel
        htmlFor={field.name}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Combobox
        items={items}
        value={field.state.value}
        onValueChange={(v) => {
          field.handleChange(v !== null ? (v as string) : '');
        }}
        itemToStringLabel={(v) => items.find((i) => i.value === v)?.label ?? v}
      >
        <ComboboxInput
          id={field.name}
          showClear={!!field.state.value}
          placeholder={placeholder ?? 'Search…'}
          onBlur={field.handleBlur}
          aria-invalid={errors.length > 0}
        />
        <ComboboxContent>
          <ComboboxList>
            {(item: FieldOption) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}

// ── Multiple (chips) ───────────────────────────────────────────────────────────

function MultiCombobox({
  label,
  items,
  required,
  hint,
  hideLabel,
  errors,
  placeholder,
  maxSelections,
}: InnerProps) {
  const field = useFieldContext<string[]>();
  const value = field.state.value ?? [];
  const anchor = useComboboxAnchor();
  const atMax = maxSelections !== undefined && value.length >= maxSelections;

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel className={hideLabel ? 'sr-only' : undefined}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Combobox
        multiple
        items={items}
        value={value}
        onValueChange={(v: any) => field.handleChange(v as string[])}
      >
        <ComboboxChips ref={anchor}>
          {value.map((v) => (
            // ComboboxChip has no value prop — removal is tracked by position within ComboboxChips
            <ComboboxChip key={v}>
              {items.find((i) => i.value === v)?.label ?? v}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            placeholder={
              value.length === 0 ? (placeholder ?? 'Search…') : undefined
            }
            onBlur={field.handleBlur}
            aria-invalid={errors.length > 0}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxList>
            {(item: FieldOption) => (
              <ComboboxItem
                key={item.value}
                value={item.value}
                disabled={atMax && !value.includes(item.value)}
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
