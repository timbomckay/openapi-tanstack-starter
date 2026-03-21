import { useState } from 'react';

import { CalendarIcon } from '@phosphor-icons/react';

import { Calendar } from '@/components/ui/calendar';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useFieldContext } from '@/hooks/form-context';
import { cn } from '@/lib/utils';

/** Parse ISO date string to a Date without timezone shift. */
function parseDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/** Format a Date to ISO date string ("yyyy-mm-dd"). */
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format a Date for human display using the browser locale. */
function formatDisplay(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface DateFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  readonly?: boolean;
  hideLabel?: boolean;
}

export function DateField({
  label,
  required,
  hint,
  readonly,
  hideLabel,
}: DateFieldProps) {
  const field = useFieldContext<string>();
  const errors = field.state.meta.errors
    .filter(Boolean)
    .map((e) => ({ message: String(e) }));
  const [open, setOpen] = useState(false);

  const selected = parseDate(field.state.value);

  return (
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel
        htmlFor={field.name}
        className={hideLabel ? 'sr-only' : undefined}
      >
        {label}
        {required && <span className="text-destructive"> *</span>}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={field.name}
          disabled={readonly}
          aria-invalid={errors.length > 0 || undefined}
          className={cn(
            // Match Input appearance
            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm',
            'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
            'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
            'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
            !selected && 'text-muted-foreground',
          )}
        >
          <span>{selected ? formatDisplay(selected) : 'Pick a date'}</span>
          <CalendarIcon className="size-4 opacity-50" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              field.handleChange(date ? toISO(date) : '');
              field.handleBlur();
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {hint && <FieldDescription>{hint}</FieldDescription>}
      <FieldError errors={errors} />
    </Field>
  );
}
