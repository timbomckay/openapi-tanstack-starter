import { useState } from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import {
  PlusCircleIcon,
  ArrowSquareOutIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import * as z from 'zod';

import type { Pet } from '@/api/petstore/generated/types.gen';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { zPet } from '@/api/petstore/generated/zod.gen';
import { DataTable } from '@/components/data-table/data-table';
import { zodToColumns } from '@/components/data-table/zod-to-columns';
import { buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/pets/')({
  validateSearch: z.object({
    status: z
      .enum(['available', 'pending', 'sold'])
      .optional()
      .catch('available'),
  }),
  component: PetsPage,
});

type PetStatus = NonNullable<z.infer<typeof zPet>['status']>;
const petStatuses = zPet.shape.status.unwrap().options;

const columns: ColumnDef<Pet>[] = [
  ...(zodToColumns(zPet, {
    name: { grow: true },
    photoUrls: false,
    status: {
      badge: {
        variants: {
          available: 'default',
          pending: 'secondary',
          sold: 'destructive',
        },
        icons: {
          available: CheckCircleIcon,
          pending: ClockIcon,
          sold: XCircleIcon,
        },
      },
    },
  }) as ColumnDef<Pet>[]),
  {
    id: 'actions',
    cell: ({ row }: { row: { original: Pet } }) => (
      <Link
        to="/pets/$petId"
        params={{ petId: String(row.original.id) }}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'size-7 p-0',
        )}
      >
        <ArrowSquareOutIcon className="size-3.5" />
      </Link>
    ),
  },
];

function PetsPage() {
  const { status: searchStatus } = Route.useSearch();
  const [status, setStatus] = useState<PetStatus>(searchStatus ?? 'available');

  const { data, isLoading, isError } = useQuery(
    findPetsByStatusOptions({ client: petstoreClient, query: { status } }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pets</h1>
          <p className="text-muted-foreground">
            Browse and manage all pets in the store.
          </p>
        </div>
        <Link to="/pets/new" className={buttonVariants()}>
          <PlusCircleIcon className="mr-2 size-4" />
          Add pet
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Status</span>
        <Select
          value={status}
          onValueChange={(v) => {
            if (v) setStatus(v as PetStatus);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {petStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load pets. The Petstore API may be unavailable.
        </div>
      ) : (
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      )}
    </div>
  );
}
