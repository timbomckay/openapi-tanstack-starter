import { CircleNotchIcon } from '@phosphor-icons/react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from '@/components/ui/input-group';
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
  const isValidating = field.state.meta.isValidating;

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel
        htmlFor={field.name}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <InputGroup>
        <InputGroupTextarea
          id={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readonly}
          aria-invalid={errors.length > 0}
        />
        {isValidating && (
          <InputGroupAddon align="block-end">
            <CircleNotchIcon
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden
            />
          </InputGroupAddon>
        )}
      </InputGroup>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
