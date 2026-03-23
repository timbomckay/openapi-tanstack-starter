import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { useFieldContext } from '@/hooks/form-context';

interface SwitchFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  hideLabel?: boolean;
  disabled?: boolean;
}

export function SwitchField({
  label,
  hint,
  required,
  hideLabel,
  disabled,
}: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const errors = field.state.meta.errors.filter(Boolean).map((e) => ({
    message: String(e),
  }));
  const isInvalid = field.state.meta.isTouched && errors.length > 0;

  return (
    <Field orientation="horizontal" data-invalid={isInvalid || undefined}>
      <FieldContent>
        <FieldLabel
          htmlFor={field.name}
          className={hideLabel ? 'sr-only' : undefined}
        >
          {label}
          {required && <span className="text-destructive"> *</span>}
        </FieldLabel>
        {hint && <FieldDescription>{hint}</FieldDescription>}
        {isInvalid && <FieldError errors={errors} />}
      </FieldContent>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value ?? false}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
        disabled={disabled}
        aria-invalid={isInvalid}
      />
    </Field>
  );
}
