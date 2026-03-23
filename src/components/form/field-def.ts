import type React from 'react';

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'password'
  | 'textarea'
  | 'hidden'
  | 'file'
  | 'select'
  | 'combobox'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'repeater';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldCondition {
  /** The name of the field whose value controls visibility. */
  name: string;
  /** Defaults to '===' when omitted. */
  operator?: '===' | '!==' | 'in' | 'not-in' | '>' | '>=' | '<' | '<=';
  value:
    | string
    | number
    | boolean
    | null
    | Array<string | number | boolean | null>;
}

/** Mirrors TanStack Form's per-field validator shape, typed for unknown field values. */
export interface FieldValidators {
  onChange?: (ctx: { value: unknown }) => string | undefined;
  onChangeAsync?: (ctx: { value: unknown }) => Promise<string | undefined>;
  onBlur?: (ctx: { value: unknown }) => string | undefined;
  onBlurAsync?: (ctx: { value: unknown }) => Promise<string | undefined>;
  onSubmit?: (ctx: { value: unknown }) => string | undefined;
  onSubmitAsync?: (ctx: { value: unknown }) => Promise<string | undefined>;
}

/**
 * Escape hatch for inserting arbitrary content or a custom form.AppField
 * inline within a fields array. Receives the form instance so you have full
 * access to form.AppField, form.Subscribe, form.getFieldValue, etc.
 *
 * Example:
 *   {
 *     key: 'avatar',
 *     render: (form) => (
 *       <form.AppField name="avatar">
 *         {(field) => <AvatarUpload field={field} />}
 *       </form.AppField>
 *     ),
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface RenderItem<TForm = any> {
  key?: string;
  render: (form: TForm) => React.ReactNode;
}

export interface FieldDef {
  /** Must match a key in the form's defaultValues. */
  name: string;
  /**
   * Initial value for this field. Used by deriveDefaults / useFieldForm to
   * build the defaultValues object so the fields array is the single source
   * of truth. Omitting falls back to an empty string.
   */
  defaultValue?: unknown;
  label?: string;
  /** When true, the label is rendered as visually hidden (sr-only) for accessibility. */
  hideLabel?: boolean;
  /** Helper text rendered below the control. */
  hint?: string;
  placeholder?: string;
  /** For type='file': restricts accepted file types (e.g. 'image/*', '.pdf,.docx'). */
  accept?: string;
  /**
   * Explicit control type. When omitted, DynamicField resolves it:
   *   - options present + multiple → 'checkbox'
   *   - options.length > threshold (default 4) → 'select'
   *   - options.length <= threshold → 'radio'
   *   - no options → 'text'
   */
  type?: FieldType;
  /** When true with options, renders a checkbox group instead of radio/select. */
  multiple?: boolean;
  /**
   * Maximum number of items that can be selected. Applies to checkbox groups,
   * multi-select, and multi-combobox — unselected options are disabled once the
   * limit is reached. Auto-inferred from `z.array().max(n)` via zodToFields.
   */
  maxSelections?: number;
  /**
   * Options for radio, checkbox, or select.
   *
   * Static forms: pass `FieldOption[]` or `string[]` (strings are normalised to `{ value, label }`).
   *
   * Dynamic / queried options: pass a hook-shaped function — TanStack Query hooks
   * can be called inside it freely since DynamicField calls it at the component's
   * top level. When a function is provided and no explicit `type` is set, DynamicField
   * defaults to `'select'` (or `'checkbox'` if `multiple: true`) so the control is
   * stable while the query loads — no layout shift as the option count changes.
   *
   * @example static
   *   options: ['active', 'inactive']
   *
   * @example queried
   *   options: () => {
   *     const { data } = useQuery(getTagsOptions({ client }));
   *     return data?.map(t => ({ value: String(t.id), label: t.name ?? '' })) ?? [];
   *   }
   */
  options?: FieldOption[] | string[] | (() => FieldOption[]) | (() => string[]);
  required?: boolean;
  disabled?: boolean;
  /**
   * When true, the field is read-only: the input renders as non-editable and
   * all validators are suppressed (required check included).
   */
  readonly?: boolean;
  /**
   * Custom validators in TanStack Form's validator shape. Composed with the
   * built-in required check — required runs first, then your custom validator.
   */
  validators?: FieldValidators;
  /**
   * Debounce delay in ms for async validators (onChangeAsync / onBlurAsync).
   * Passed directly to TanStack Form's asyncDebounceMs field option.
   * Defaults to 300ms when an async validator is present.
   */
  asyncDebounceMs?: number;
  /**
   * Show this field only when the referenced field satisfies the condition.
   * Hidden fields are NOT registered in form state.
   */
  condition?: FieldCondition;
  /**
   * For type='repeater': child field definitions for each array item.
   *
   * - Scalar array (string[], number[]): one child with name='' — the item IS the value.
   *   The child's type, required, and validators apply to each individual input.
   * - Object array ({ id, name }[]): one named child per property.
   *   Each row renders those fields bound to item[i].propertyName.
   *
   * Auto-populated by zodToFields for ZodArray types. Override to customise
   * item-level labels, validation, or which properties are shown.
   */
  fields?: FieldDef[];
  /**
   * For type='repeater': label for the "Add" button.
   * Defaults to "Add {label.toLowerCase()}" or "Add item" if no label.
   */
  addLabel?: string;
}
