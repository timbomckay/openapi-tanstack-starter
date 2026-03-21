import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import * as z from 'zod';

import { petstoreClient } from '@/api/petstore/client';
import { addPetMutation } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { FormBuilder } from '@/components/form/form-builder';
import { zodToFields } from '@/components/form/zod-to-fields';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFieldForm } from '@/hooks/use-field-form';

export const Route = createFileRoute('/pets/new')({
  component: NewPetPage,
});

// Pass zPet directly — id, category, tags are auto-skipped (bigint, object, array).
// photoUrls (ZodArray) is auto-inferred as a repeater field.
const fields = zodToFields(zPet, {
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
});

const submitSchema = z.object({
  name: zPet.shape.name,
  status: zPet.shape.status.unwrap(),
  photoUrls: zPet.shape.photoUrls,
});

function NewPetPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...addPetMutation({ client: petstoreClient }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [{ _id: 'findPetsByStatus' }],
      });
      toast.success('Pet added successfully');
      void navigate({ to: '/pets' });
    },
    onError: () => {
      toast.error('Failed to add pet. Please try again.');
    },
  });

  const form = useFieldForm({
    fields,
    onSubmit: async ({ value, formApi }) => {
      if (!formApi.state.isValid) return;
      const result = submitSchema.safeParse(value);
      if (!result.success) return;
      mutation.mutate({ body: result.data });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/pets"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to pets
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Pet</h1>
        <p className="text-muted-foreground">
          Register a new pet in the Petstore.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Pet details</CardTitle>
          <CardDescription>
            Fill in the information for the new pet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="space-y-4"
          >
            <FormBuilder form={form} fields={fields} />

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Adding…' : 'Add pet'}
              </Button>
              <Link
                to="/pets"
                className={buttonVariants({ variant: 'outline' })}
              >
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
