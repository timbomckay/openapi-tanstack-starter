import * as z from 'zod';

import { zPet } from '@/api/petstore/generated/zod.gen';
import { zodToFields } from '@/components/form/zod-to-fields';

export const petFields = zodToFields(zPet, {
  name: {
    placeholder: 'Fluffy',
    validators: {
      onChange: ({ value }) => {
        const r = z
          .string()
          .min(1, 'Name is required')
          .max(100, 'Name is too long')
          .safeParse(value);
        return r.success ? undefined : r.error.issues[0]?.message;
      },
    },
  },
  status: { required: true, defaultValue: 'available' },
  photoUrls: { label: 'Photo URLs', addLabel: 'Add photo URL' },
  tags: { addLabel: 'Add tag' },
});
