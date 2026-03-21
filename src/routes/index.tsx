import {
  PlusCircleIcon,
  PawPrintIcon,
  ShoppingBagIcon,
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import { petstoreClient } from '@/api/petstore/client';
import { findPetsByStatusOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: DashboardPage,
});

function DashboardPage() {
  const availableQuery = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'available' },
    }),
  );
  const pendingQuery = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'pending' },
    }),
  );
  const soldQuery = useQuery(
    findPetsByStatusOptions({
      client: petstoreClient,
      query: { status: 'sold' },
    }),
  );

  const stats = [
    {
      title: 'Available',
      count: availableQuery.data?.length,
      loading: availableQuery.isLoading,
    },
    {
      title: 'Pending',
      count: pendingQuery.data?.length,
      loading: pendingQuery.isLoading,
    },
    {
      title: 'Sold',
      count: soldQuery.data?.length,
      loading: soldQuery.isLoading,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Petstore inventory overview powered by the Petstore v3 API.
          </p>
        </div>
        <Link to="/pets/new" className={buttonVariants()}>
          <PlusCircleIcon className="mr-2 size-4" />
          Add Pet
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(({ title, count, loading }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <PawPrintIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold">{count ?? '—'}</p>
              )}
              <Badge className="mt-1" variant="secondary">
                {title.toLowerCase()}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrintIcon className="size-5" />
              Pets
            </CardTitle>
            <CardDescription>
              Browse and manage all pets in the store.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/pets" className={buttonVariants({ variant: 'outline' })}>
              View all pets
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBagIcon className="size-5" />
              Add New Pet
            </CardTitle>
            <CardDescription>
              Register a new pet with name, status, and tags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/pets/new" className={cn(buttonVariants())}>
              <PlusCircleIcon className="mr-2 size-4" />
              Add pet
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
