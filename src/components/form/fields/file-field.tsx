import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext } from '@/hooks/form-context';

interface FileFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  hideLabel?: boolean;
  accept?: string;
  multiple?: boolean;
}

export function FileField({
  label,
  required,
  hint,
  hideLabel,
  accept,
  multiple,
}: FileFieldProps) {
  const field = useFieldContext<File | FileList | null>();
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
      <Input
        id={field.name}
        type="file"
        accept={accept}
        multiple={multiple}
        onBlur={field.handleBlur}
        onChange={(e) => {
          const files = e.target.files;
          if (!files || files.length === 0) {
            field.handleChange(null);
          } else {
            field.handleChange(multiple ? files : files[0]);
          }
        }}
        aria-invalid={errors.length > 0}
      />
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
