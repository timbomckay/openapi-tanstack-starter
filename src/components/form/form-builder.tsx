import { Fragment, type ReactNode } from 'react';

import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field';

import type { FieldCondition, FieldDef, RenderItem } from './field-def';

import { RepeaterField } from './fields/repeater-field';

// Structural type capturing the form methods FormBuilder actually calls.
// Avoids coupling to TanStack Form's internal generic type params while
// still accepting any form returned by useAppForm / useFieldForm.
interface BuildableForm {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AppField: (props: any) => ReactNode | Promise<ReactNode>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Subscribe: (props: any) => ReactNode | Promise<ReactNode>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Field: (props: any) => ReactNode | Promise<ReactNode>;
  getFieldValue: (name: never) => unknown;
}

function evaluateCondition(value: unknown, condition: FieldCondition): boolean {
  const { operator = '===', value: target } = condition;
  switch (operator) {
    case '===':
      return value === target;
    case '!==':
      return value !== target;
    case 'in':
      return Array.isArray(target) && (target as unknown[]).includes(value);
    case 'not-in':
      return Array.isArray(target) && !(target as unknown[]).includes(value);
    case '>':
      return (value as number) > (target as number);
    case '>=':
      return (value as number) >= (target as number);
    case '<':
      return (value as number) < (target as number);
    case '<=':
      return (value as number) <= (target as number);
    default:
      return value === target;
  }
}

interface FormBuilderProps {
  form: BuildableForm;
  fields: (FieldDef | RenderItem<BuildableForm>)[];
  /** Options count threshold for radio → select promotion. Defaults to 6. */
  threshold?: number;
  /**
   * Options count threshold for select → combobox promotion.
   * Defaults to `threshold * 4` inside DynamicField.
   * Function-based options always resolve to combobox regardless of this value.
   */
  comboboxThreshold?: number;
}

function isEmpty(value: unknown): boolean {
  return (
    value == null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/** Compose required check + optional custom validator for a given trigger. */
function composeValidator(
  required: boolean | undefined,
  custom: ((ctx: { value: unknown }) => string | undefined) | undefined,
  isUnset: (value: unknown) => boolean = isEmpty,
): ((ctx: { value: unknown }) => string | undefined) | undefined {
  if (!required && !custom) return undefined;
  if (required && custom)
    return (ctx) => (isUnset(ctx.value) ? 'Required' : custom(ctx));
  if (required) return (ctx) => (isUnset(ctx.value) ? 'Required' : undefined);
  return custom;
}

/**
 * Wraps a validator so it returns undefined (no error) when the field's
 * condition is not met. AppField is always mounted for conditional fields so
 * validators always run during validateAllFields — this wrapper actively clears
 * stale errors for hidden fields so they never block submission.
 */
function wrapWithCondition(
  validator: ((ctx: { value: unknown }) => string | undefined) | undefined,
  condition: FieldCondition,
  getFieldValue: (name: string) => unknown,
): ((ctx: { value: unknown }) => string | undefined) | undefined {
  if (!validator) return undefined;
  return (ctx) => {
    if (!evaluateCondition(getFieldValue(condition.name), condition))
      return undefined;
    return validator(ctx);
  };
}

function wrapWithConditionAsync(
  validator:
    | ((ctx: { value: unknown }) => Promise<string | undefined>)
    | undefined,
  condition: FieldCondition,
  getFieldValue: (name: string) => unknown,
): ((ctx: { value: unknown }) => Promise<string | undefined>) | undefined {
  if (!validator) return undefined;
  return async (ctx) => {
    if (!evaluateCondition(getFieldValue(condition.name), condition))
      return undefined;
    return validator(ctx);
  };
}

export function FormBuilder({
  form,
  fields,
  threshold = 6,
  comboboxThreshold = threshold * 4,
}: FormBuilderProps) {
  const getFieldValue = (name: string) => form.getFieldValue(name as never);

  const buildValidators = (fieldDef: FieldDef) => {
    if (fieldDef.readonly || fieldDef.type === 'hidden') return undefined;
    // For switches, required means must be checked (true) — false is not "empty"
    // by the default isEmpty check, so we use a type-specific sentinel.
    const isUnset =
      fieldDef.type === 'switch' ? (v: unknown) => v !== true : isEmpty;
    const onChange = composeValidator(
      fieldDef.required,
      fieldDef.validators?.onChange,
      isUnset,
    );
    const onBlur = fieldDef.validators?.onBlur;
    const onSubmit = fieldDef.validators?.onSubmit;
    const onChangeAsync = fieldDef.validators?.onChangeAsync;
    const onBlurAsync = fieldDef.validators?.onBlurAsync;
    const onSubmitAsync = fieldDef.validators?.onSubmitAsync;

    if (!fieldDef.condition) {
      if (
        !onChange &&
        !onBlur &&
        !onSubmit &&
        !onChangeAsync &&
        !onBlurAsync &&
        !onSubmitAsync
      )
        return undefined;
      return {
        onChange,
        onBlur,
        onSubmit,
        onChangeAsync,
        onBlurAsync,
        onSubmitAsync,
      };
    }

    const { condition } = fieldDef;
    const condOnChange = wrapWithCondition(onChange, condition, getFieldValue);
    const condOnBlur = wrapWithCondition(onBlur, condition, getFieldValue);
    const condOnSubmit = wrapWithCondition(onSubmit, condition, getFieldValue);
    const condOnChangeAsync = wrapWithConditionAsync(
      onChangeAsync,
      condition,
      getFieldValue,
    );
    const condOnBlurAsync = wrapWithConditionAsync(
      onBlurAsync,
      condition,
      getFieldValue,
    );
    const condOnSubmitAsync = wrapWithConditionAsync(
      onSubmitAsync,
      condition,
      getFieldValue,
    );
    if (
      !condOnChange &&
      !condOnBlur &&
      !condOnSubmit &&
      !condOnChangeAsync &&
      !condOnBlurAsync &&
      !condOnSubmitAsync
    )
      return undefined;
    return {
      onChange: condOnChange,
      onBlur: condOnBlur,
      onSubmit: condOnSubmit,
      onChangeAsync: condOnChangeAsync,
      onBlurAsync: condOnBlurAsync,
      onSubmitAsync: condOnSubmitAsync,
    };
  };

  return (
    <FieldGroup>
      {fields.map((fieldDef, index) => {
        if ('render' in fieldDef) {
          return (
            <Fragment key={fieldDef.key ?? index}>
              {fieldDef.render(form)}
            </Fragment>
          );
        }

        const validators = buildValidators(fieldDef);

        // Repeater fields need mode="array" and the form instance for sub-fields.
        // AppField does not set formContext, so we pass form explicitly.
        const asyncDebounceMs =
          fieldDef.asyncDebounceMs ??
          ((fieldDef.validators?.onChangeAsync ??
          fieldDef.validators?.onBlurAsync)
            ? 300
            : undefined);

        if (fieldDef.type === 'group') {
          const { name: groupName, label, fields: subFields = [] } = fieldDef;
          return (
            <FieldSet
              key={groupName}
              className="gap-3 rounded-lg border p-3 pt-2"
            >
              {label && (
                <FieldLegend variant="label" className="-ml-1 px-1">
                  {label}
                </FieldLegend>
              )}
              {subFields.map((subField) => {
                const fullName = `${groupName}.${subField.name}` as never;
                const subValidators = buildValidators(subField);
                const subAsyncDebounceMs =
                  subField.asyncDebounceMs ??
                  ((subField.validators?.onChangeAsync ??
                  subField.validators?.onBlurAsync)
                    ? 300
                    : undefined);
                return (
                  <form.AppField
                    key={subField.name}
                    name={fullName}
                    validators={subValidators}
                    asyncDebounceMs={subAsyncDebounceMs}
                  >
                    {(f: {
                      DynamicField: (p: {
                        field: FieldDef;
                        threshold?: number;
                        comboboxThreshold?: number;
                      }) => ReactNode;
                    }) => (
                      <f.DynamicField
                        field={subField}
                        threshold={threshold}
                        comboboxThreshold={comboboxThreshold}
                      />
                    )}
                  </form.AppField>
                );
              })}
            </FieldSet>
          );
        }

        if (fieldDef.type === 'repeater') {
          const repeaterCondition = fieldDef.condition;
          const repeaterContent = !repeaterCondition
            ? () => <RepeaterField field={fieldDef} form={form} />
            : () => (
                <form.Subscribe
                  selector={(state: { values: Record<string, unknown> }) =>
                    state.values[repeaterCondition.name]
                  }
                >
                  {(condValue: unknown) =>
                    evaluateCondition(condValue, repeaterCondition) ? (
                      <RepeaterField field={fieldDef} form={form} />
                    ) : null
                  }
                </form.Subscribe>
              );
          return (
            <form.AppField
              key={fieldDef.name}
              name={fieldDef.name as never}
              mode="array"
              validators={validators}
              asyncDebounceMs={asyncDebounceMs}
            >
              {repeaterContent}
            </form.AppField>
          );
        }

        if (!fieldDef.condition) {
          return (
            <form.AppField
              key={fieldDef.name}
              name={fieldDef.name as never}
              validators={validators}
              asyncDebounceMs={asyncDebounceMs}
            >
              {(f: {
                DynamicField: (p: {
                  field: FieldDef;
                  threshold?: number;
                  comboboxThreshold?: number;
                }) => ReactNode;
              }) => (
                <f.DynamicField
                  field={fieldDef}
                  threshold={threshold}
                  comboboxThreshold={comboboxThreshold}
                />
              )}
            </form.AppField>
          );
        }

        const { condition } = fieldDef;
        return (
          <form.AppField
            key={fieldDef.name}
            name={fieldDef.name as never}
            validators={validators}
            asyncDebounceMs={asyncDebounceMs}
          >
            {(f: {
              DynamicField: (p: {
                field: FieldDef;
                threshold?: number;
              }) => ReactNode;
            }) => (
              <form.Subscribe
                selector={(state: { values: Record<string, unknown> }) =>
                  state.values[condition.name]
                }
              >
                {(condValue: unknown) =>
                  evaluateCondition(condValue, condition) ? (
                    <f.DynamicField field={fieldDef} threshold={threshold} />
                  ) : null
                }
              </form.Subscribe>
            )}
          </form.AppField>
        );
      })}
    </FieldGroup>
  );
}
