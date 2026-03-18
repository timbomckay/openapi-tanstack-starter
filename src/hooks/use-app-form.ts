import { createFormHook } from '@tanstack/react-form';

import { SelectField } from '@/components/form/fields/select-field';
import { TextField } from '@/components/form/fields/text-field';

import { fieldContext, formContext } from './form-context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
  },
  formComponents: {},
});
