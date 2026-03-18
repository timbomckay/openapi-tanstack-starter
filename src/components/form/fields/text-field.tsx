import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFieldContext } from '@/hooks/form-context';

interface TextFieldProps {
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

export function TextField({ label, placeholder, type = 'text', required }: TextFieldProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={field.name}
        type={type}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={field.state.meta.errors.length > 0}
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
      )}
    </div>
  );
}
