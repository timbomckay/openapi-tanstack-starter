import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import type { Pet } from '@/api/petstore/generated/types.gen';

import { petstoreClient } from '@/api/petstore/client';
import {
  getPetByIdOptions,
  getPetByIdQueryKey,
  updatePetMutation,
} from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { FormBuilder } from '@/components/form/form-builder';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppForm } from '@/hooks/use-app-form';

import { petFields } from '../-pet-fields';

export const Route = createFileRoute('/pets/$petId/edit')({
  component: EditPetPage,
});

function EditPetPage() {
  const { petId } = Route.useParams();

  const {
    data: pet,
    isLoading,
    isError,
  } = useQuery(
    getPetByIdOptions({
      client: petstoreClient,
      path: { petId: Number(petId) },
    }),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="space-y-6">
        <Link
          to="/pets"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to pets
        </Link>
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Pet not found or the API is unavailable.
        </div>
      </div>
    );
  }

  return <EditPetForm pet={pet} petId={petId} />;
}

function EditPetForm({ pet, petId }: { pet: Pet; petId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...updatePetMutation({ client: petstoreClient }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [{ _id: 'findPetsByStatus' }],
      });
      void queryClient.invalidateQueries({
        queryKey: getPetByIdQueryKey({
          client: petstoreClient,
          path: { petId: Number(petId) },
        }),
      });
      toast.success('Pet updated successfully');
      void navigate({ to: '/pets/$petId', params: { petId } });
    },
    onError: () => {
      toast.error('Failed to update pet. Please try again.');
    },
  });

  const form = useAppForm({
    defaultValues: {
      id: pet.id,
      name: pet.name ?? '',
      photoUrls: pet.photoUrls ?? [],
      tags: (pet.tags ?? []) as { id?: bigint; name?: string }[],
      status: pet.status ?? ('available' as const),
    },
    canSubmitWhenInvalid: true,
    onSubmit: async ({ value, formApi }) => {
      if (!formApi.state.isValid) return;
      const result = zPet.safeParse({
        ...value,
        tags: (value as { tags?: { id?: bigint; name?: string }[] }).tags?.map(
          (t) => ({ ...t, id: t.id ?? BigInt(Date.now()) }),
        ),
      });
      if (!result.success) return;
      mutation.mutate({
        body: result.data as unknown as Parameters<
          typeof mutation.mutate
        >[0]['body'],
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/pets/$petId"
          params={{ petId }}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeftIcon className="mr-2 size-4" />
          Back to {pet.name}
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Pet</h1>
        <p className="text-muted-foreground">
          Update the details for {pet.name}.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Pet details</CardTitle>
          <CardDescription>
            Make changes and save to update the pet.
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
            <FormBuilder form={form} fields={petFields} />

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Link
                to="/pets/$petId"
                params={{ petId }}
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
