import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFieldContext } from '@/hooks/form-context';

import type { FieldOption } from '../field-def';

interface RadioGroupFieldProps {
  label: string;
  options: FieldOption[];
  required?: boolean;
  hint?: string;
  hideLabel?: boolean;
}

export function RadioGroupField({
  label,
  options,
  required,
  hint,
  hideLabel,
}: RadioGroupFieldProps) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.errors
    .filter(Boolean)
    .map((e) => ({ message: String(e) }));

  return (
    <FieldSet id={field.name}>
      <FieldLegend
        variant="label"
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLegend>
      <RadioGroup
        value={field.state.value}
        onValueChange={(v) => {
          if (v !== null) field.handleChange(v);
        }}
        onBlur={field.handleBlur}
        aria-invalid={errors.length > 0}
      >
        {options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem
              id={`${field.name}-${opt.value}`}
              value={opt.value}
            />
            <Label htmlFor={`${field.name}-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </FieldSet>
  );
}
