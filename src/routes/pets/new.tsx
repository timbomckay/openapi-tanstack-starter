import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { petstoreClient } from '@/api/petstore/client';
import { addPetMutation } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm } from '@/hooks/use-app-form';

export const Route = createFileRoute('/pets/new')({
  component: NewPetPage,
});

// Derive from the generated API schema — status enum stays in sync with the spec
const newPetSchema = zPet.pick({ name: true, status: true }).extend({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  status: zPet.shape.status.unwrap(), // required (not optional) for the form
  categoryName: z.string().optional(),
  photoUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});

type NewPetForm = z.infer<typeof newPetSchema>;

// Derived from the enum so new statuses are picked up automatically
const statusItems = zPet.shape.status.unwrap().options.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}));

function NewPetPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...addPetMutation({ client: petstoreClient }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [{ _id: 'findPetsByStatus' }] });
      toast.success('Pet added successfully');
      void navigate({ to: '/pets' });
    },
    onError: () => {
      toast.error('Failed to add pet. Please try again.');
    },
  });

  const form = useAppForm({
    defaultValues: {
      name: '',
      status: 'available' as NewPetForm['status'],
      categoryName: '',
      photoUrl: '',
    },
    onSubmit: async ({ value }) => {
      const result = newPetSchema.safeParse(value);
      if (!result.success) return;

      mutation.mutate({
        body: {
          name: result.data.name,
          status: result.data.status,
          photoUrls: result.data.photoUrl ? [result.data.photoUrl] : [],
          category: result.data.categoryName ? { name: result.data.categoryName } : undefined,
        },
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/pets" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to pets
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Pet</h1>
        <p className="text-muted-foreground">Register a new pet in the Petstore.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Pet details</CardTitle>
          <CardDescription>Fill in the information for the new pet.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.AppField
              name="name"
              validators={{
                onChange: ({ value }) => {
                  const result = newPetSchema.shape.name.safeParse(value);
                  return result.success ? undefined : result.error.issues[0]?.message;
                },
              }}
            >
              {(field) => <field.TextField label="Name" placeholder="Fluffy" required />}
            </form.AppField>

            <form.AppField name="status">
              {(field) => <field.SelectField label="Status" items={statusItems} />}
            </form.AppField>

            <form.AppField name="categoryName">
              {(field) => <field.TextField label="Category" placeholder="Dogs, Cats, Birds…" />}
            </form.AppField>

            <form.AppField
              name="photoUrl"
              validators={{
                onChange: ({ value }) => {
                  const result = newPetSchema.shape.photoUrl.safeParse(value);
                  return result.success ? undefined : result.error.issues[0]?.message;
                },
              }}
            >
              {(field) => (
                <field.TextField
                  label="Photo URL"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                />
              )}
            </form.AppField>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Adding…' : 'Add pet'}
              </Button>
              <Link to="/pets" className={buttonVariants({ variant: 'outline' })}>
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
