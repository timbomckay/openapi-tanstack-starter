import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFieldContext } from '@/hooks/form-context';

interface SelectItem {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  items: SelectItem[];
}

export function SelectField({ label, items }: SelectFieldProps) {
  const field = useFieldContext<string>();

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.name}>{label}</Label>
      <Select
        value={field.state.value}
        onValueChange={(v) => {
          if (v) field.handleChange(v);
        }}
      >
        <SelectTrigger id={field.name}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field.state.meta.errors.length > 0 && (
        <p className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</p>
      )}
    </div>
  );
}
