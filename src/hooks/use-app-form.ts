import { createFormHook } from '@tanstack/react-form';

import { CheckboxGroupField } from '@/components/form/fields/checkbox-group-field';
import { DynamicField } from '@/components/form/fields/dynamic-field';
import { FileField } from '@/components/form/fields/file-field';
import { RadioGroupField } from '@/components/form/fields/radio-group-field';
import { SelectField } from '@/components/form/fields/select-field';
import { TextField } from '@/components/form/fields/text-field';
import { TextareaField } from '@/components/form/fields/textarea-field';

import { fieldContext, formContext } from './form-context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    TextareaField,
    SelectField,
    RadioGroupField,
    CheckboxGroupField,
    FileField,
    DynamicField,
  },
  formComponents: {},
});
