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
  InputGroupInput,
} from '@/components/ui/input-group';
import { useFieldContext } from '@/hooks/form-context';

interface TextFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  disabled?: boolean;
  readonly?: boolean;
  hideLabel?: boolean;
}

export function TextField({
  label,
  placeholder,
  type = 'text',
  required,
  hint,
  disabled,
  readonly,
  hideLabel,
}: TextFieldProps) {
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
        <InputGroupInput
          id={field.name}
          type={type}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readonly}
          aria-invalid={errors.length > 0}
        />
        {isValidating && (
          <InputGroupAddon align="inline-end">
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
