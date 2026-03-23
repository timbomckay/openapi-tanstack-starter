import { Checkbox } from '@/components/ui/checkbox';
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { useFieldContext } from '@/hooks/form-context';

import type { FieldOption } from '../field-def';

interface CheckboxGroupFieldProps {
  label: string;
  options: FieldOption[];
  required?: boolean;
  hint?: string;
  hideLabel?: boolean;
  maxSelections?: number;
}

export function CheckboxGroupField({
  label,
  options,
  required,
  hint,
  hideLabel,
  maxSelections,
}: CheckboxGroupFieldProps) {
  const field = useFieldContext<string[]>();
  const errors = field.state.meta.errors
    .filter(Boolean)
    .map((e) => ({ message: String(e) }));
  const selected = field.state.value ?? [];

  function toggle(value: string, checked: boolean) {
    field.handleChange(
      checked ? [...selected, value] : selected.filter((v) => v !== value),
    );
  }

  return (
    <FieldSet id={field.name}>
      <FieldLegend
        variant="label"
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLegend>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <Checkbox
              id={`${field.name}-${opt.value}`}
              checked={selected.includes(opt.value)}
              onCheckedChange={(checked) => toggle(opt.value, !!checked)}
              onBlur={field.handleBlur}
              aria-invalid={errors.length > 0}
              disabled={
                maxSelections !== undefined &&
                !selected.includes(opt.value) &&
                selected.length >= maxSelections
              }
            />
            <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </div>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </FieldSet>
  );
}
