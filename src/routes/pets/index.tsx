import { useState } from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { PlusCircleIcon, ArrowSquareOutIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import type { Pet } from '@/api/petstore/generated/types.gen';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
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
  component: PetsPage,
});

type PetStatus = 'available' | 'pending' | 'sold';

const statusVariantMap: Record<PetStatus, 'default' | 'secondary' | 'destructive'> = {
  available: 'default',
  pending: 'secondary',
  sold: 'destructive',
};

const columns: ColumnDef<Pet>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.getValue('id')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.original.category;
      return category ? (
        <span className="text-sm text-muted-foreground">{category.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground/40">—</span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<PetStatus>('status');
      return status ? (
        <Badge variant={statusVariantMap[status] ?? 'secondary'}>{status}</Badge>
      ) : null;
    },
  },
  {
    id: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.original.tags ?? [];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <Link
        to="/pets/$petId"
        params={{ petId: String(row.original.id) }}
        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'size-7 p-0')}
      >
        <ArrowSquareOutIcon className="size-3.5" />
      </Link>
    ),
  },
];

function PetsPage() {
  const [status, setStatus] = useState<PetStatus>('available');

  const { data, isLoading, isError } = useQuery(
    findPetsByStatusOptions({ client: petstoreClient, query: { status } }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pets</h1>
          <p className="text-muted-foreground">Browse and manage all pets in the store.</p>
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
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
