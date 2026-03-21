import type { FieldDef, RenderItem } from '@/components/form/field-def';

import { useAppForm } from './use-app-form';

/**
 * Builds a defaultValues object from a FieldDef array.
 * Each field's `defaultValue` property becomes the initial value for that field.
 * Fields without a `defaultValue` default to an empty string.
 * RenderItem entries are ignored — manage their defaultValues in useAppForm directly.
 *
 * Exported separately for cases where you want to call useAppForm directly
 * but still derive defaults from the fields array.
 */
export function deriveDefaults(
  fields: (FieldDef | RenderItem)[],
): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((f): f is FieldDef => 'name' in f)
      .map((f) => [f.name, f.defaultValue ?? (f.multiple ? [] : '')]),
  );
}

/** Minimal formApi surface exposed to onSubmit — enough to gate API calls. */
export interface SubmitFormApi {
  state: { isValid: boolean };
}

type UseFieldFormOptions<TValues extends Record<string, unknown>> = {
  fields: (FieldDef | RenderItem)[];
  onSubmit?: (ctx: {
    value: TValues;
    formApi: SubmitFormApi;
  }) => unknown | Promise<unknown>;
  onSubmitInvalid?: (ctx: { value: TValues }) => void;
};

/**
 * Drop-in replacement for useAppForm when using FormBuilder.
 * Derives defaultValues from the fields array so field definitions are the
 * single source of truth — no need to maintain a separate defaultValues object.
 *
 * Returns the same form instance as useAppForm, so form.handleSubmit(),
 * form.reset(), form.state, etc. are all available.
 *
 * TValues defaults to Record<string, unknown> so onSubmit requires no
 * explicit type annotation. Provide the generic to get a stricter shape:
 *   useFieldForm<{ name: string; tags: string[] }>({ fields, onSubmit: ... })
 *
 * Usage:
 *   const form = useFieldForm({ fields, onSubmit: ({ value }) => ... })
 *   <FormBuilder form={form} fields={fields} />
 */
export function useFieldForm<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>({ fields, ...options }: UseFieldFormOptions<TValues>) {
  // canSubmitWhenInvalid: true ensures handleSubmit always calls validateAllFields,
  // which re-evaluates condition-aware validators with current state rather than
  // short-circuiting when prior submission errors are still in fieldMeta.
  // Callers gate the actual action by checking formApi.state.isValid in onSubmit.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useAppForm({
    defaultValues: deriveDefaults(fields),
    canSubmitWhenInvalid: true,
    ...(options as any),
  } as any);
}
