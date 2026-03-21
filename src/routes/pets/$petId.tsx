import { ArrowLeftIcon, TagIcon } from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import { petstoreClient } from '@/api/petstore/client';
import { getPetByIdOptions } from '@/api/petstore/generated/@tanstack/react-query.gen';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/pets/$petId')({
  component: PetDetailPage,
});

function PetDetailPage() {
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

      {isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Pet not found or the API is unavailable.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <CardTitle className="text-2xl">{pet?.name}</CardTitle>
            )}
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : pet?.status ? (
              <Badge
                variant={
                  pet.status === 'available'
                    ? 'default'
                    : pet.status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                }
              >
                {pet.status}
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">ID</p>
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <p className="font-mono text-sm">{pet?.id}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Category
            </p>
            {isLoading ? (
              <Skeleton className="h-5 w-32" />
            ) : (
              <p className="text-sm">{pet?.category?.name ?? '—'}</p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">
              Tags
            </p>
            {isLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ) : pet?.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {pet.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    <TagIcon className="mr-1 size-3" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-muted-foreground">
              Photos
            </p>
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : pet?.photoUrls?.length ? (
              <ul className="space-y-1 text-sm">
                {pet.photoUrls.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No photos</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
