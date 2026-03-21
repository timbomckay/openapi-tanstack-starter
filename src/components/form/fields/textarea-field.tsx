import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext } from '@/hooks/form-context';

interface TextareaFieldProps {
  label: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  readonly?: boolean;
  hideLabel?: boolean;
}

export function TextareaField({
  label,
  placeholder,
  required,
  hint,
  readonly,
  hideLabel,
}: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.errors
    .filter(Boolean)
    .map((e) => ({ message: String(e) }));

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel
        htmlFor={field.name}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Textarea
        id={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readonly}
        aria-invalid={errors.length > 0}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
