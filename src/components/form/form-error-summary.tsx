import { useEffect, useRef } from 'react';

import type { FieldDef, RenderItem } from './field-def';

// Mirrors BuildableForm in form-builder.tsx — structural type, no TanStack import needed.
interface SubscribableForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Subscribe: (props: any) => React.ReactNode | Promise<React.ReactNode>;
}

import type React from 'react';

interface FormState {
  submissionAttempts: number;
  fieldMeta: Record<string, { errors: unknown[]; isValid: boolean }>;
}

interface ErrorEntry {
  name: string;
  label: string;
  message: string;
}

interface FormErrorSummaryProps {
  form: SubscribableForm;
  /**
   * The same fields array passed to FormBuilder. Used to resolve a friendly
   * label for each errored field. RenderItems (escape-hatch entries) are
   * ignored since they don't have a field name.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: (FieldDef | RenderItem<any>)[];
}

/**
 * Inner component so we can use hooks (useRef + useEffect) to focus the
 * summary on mount. Mounted/unmounted by FormErrorSummary based on error state,
 * so focusing on mount is equivalent to focusing whenever errors first appear.
 */
function ErrorSummaryBox({ errors }: { errors: ErrorEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="rounded-md border border-destructive/50 bg-destructive/5 p-4"
    >
      <p className="mb-2 text-sm font-medium text-destructive">
        Please fix the following before submitting:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {errors.map(({ name, label, message }) => (
          <li key={name} className="text-sm">
            <a
              href={`#${name}`}
              className="font-medium text-destructive underline underline-offset-2 outline-current hover:no-underline focus-visible:no-underline"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(name);
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el?.focus({ preventScroll: true });
              }}
            >
              {label}
            </a>
            {' — '}
            <span className="text-destructive/80">{message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Renders an accessible error summary after the first failed submit attempt.
 * Place this near the submit button so users scrolled to the bottom of a long
 * form can see which fields need attention without scrolling back up.
 *
 * On appearance the summary receives focus so keyboard and screen reader users
 * are immediately aware of the errors and can tab through the links to jump to
 * each offending field.
 */
export function FormErrorSummary({ form, fields }: FormErrorSummaryProps) {
  const labelMap = new Map<string, string>(
    fields
      .filter((f): f is FieldDef => !('render' in f) && 'name' in f)
      .map((f) => [f.name, f.label ?? f.name]),
  );

  return (
    <form.Subscribe
      selector={(state: FormState) => ({
        attempts: state.submissionAttempts,
        fieldMeta: state.fieldMeta,
      })}
    >
      {({
        attempts,
        fieldMeta,
      }: {
        attempts: number;
        fieldMeta: FormState['fieldMeta'];
      }) => {
        if (attempts === 0) return null;

        const errored = Object.entries(fieldMeta)
          .filter(([, meta]) => !meta.isValid && meta.errors.length > 0)
          .map(([name, meta]) => ({
            name,
            label: labelMap.get(name) ?? name,
            message: String(meta.errors.filter(Boolean)[0] ?? 'Invalid'),
          }));

        if (errored.length === 0) return null;

        return <ErrorSummaryBox errors={errored} />;
      }}
    </form.Subscribe>
  );
}
