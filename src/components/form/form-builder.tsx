import { Fragment, type ReactNode } from 'react';

import { FieldGroup } from '@/components/ui/field';

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
): ((ctx: { value: unknown }) => string | undefined) | undefined {
  if (!required && !custom) return undefined;
  if (required && custom)
    return (ctx) => (isEmpty(ctx.value) ? 'Required' : custom(ctx));
  if (required) return (ctx) => (isEmpty(ctx.value) ? 'Required' : undefined);
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

export function FormBuilder({ form, fields, threshold = 6 }: FormBuilderProps) {
  const getFieldValue = (name: string) => form.getFieldValue(name as never);

  const buildValidators = (fieldDef: FieldDef) => {
    if (fieldDef.readonly) return undefined;
    const onChange = composeValidator(
      fieldDef.required,
      fieldDef.validators?.onChange,
    );
    const onBlur = fieldDef.validators?.onBlur;
    const onSubmit = fieldDef.validators?.onSubmit;

    if (!fieldDef.condition) {
      if (!onChange && !onBlur && !onSubmit) return undefined;
      return { onChange, onBlur, onSubmit };
    }

    const { condition } = fieldDef;
    const condOnChange = wrapWithCondition(onChange, condition, getFieldValue);
    const condOnBlur = wrapWithCondition(onBlur, condition, getFieldValue);
    const condOnSubmit = wrapWithCondition(onSubmit, condition, getFieldValue);
    if (!condOnChange && !condOnBlur && !condOnSubmit) return undefined;
    return {
      onChange: condOnChange,
      onBlur: condOnBlur,
      onSubmit: condOnSubmit,
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
            >
              {(f: {
                DynamicField: (p: {
                  field: FieldDef;
                  threshold?: number;
                }) => ReactNode;
              }) => <f.DynamicField field={fieldDef} threshold={threshold} />}
            </form.AppField>
          );
        }

        const { condition } = fieldDef;
        return (
          <form.AppField
            key={fieldDef.name}
            name={fieldDef.name as never}
            validators={validators}
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
