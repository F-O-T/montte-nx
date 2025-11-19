import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Avatar, AvatarFallback } from "@packages/ui/components/avatar";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function InfoErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Failed to load bank account information
         </AlertDescription>
      </Alert>
   );
}

function InfoSkeleton() {
   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia>
            <Skeleton className="size-12 rounded-full" />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>
               <Skeleton className="h-5 w-32" />
            </ItemTitle>
            <ItemDescription>
               <Skeleton className="h-4 w-48" />
            </ItemDescription>
         </ItemContent>
      </Item>
   );
}

function BankAccountAvatar({ name }: { name: string }) {
   return (
      <Avatar className="rounded-lg size-10">
         <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
   );
}

function BankAccountContent({ bankAccountId }: { bankAccountId: string }) {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(
      trpc.bankAccounts.getById.queryOptions({ id: bankAccountId }),
   );

   return (
      <Item className="w-full rounded-lg" variant="outline">
         <ItemMedia variant="image">
            <BankAccountAvatar name={data.name} />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>{data.name}</ItemTitle>
            <ItemDescription>
               {data.bank} - {data.type} • {data.status}
            </ItemDescription>
         </ItemContent>
      </Item>
   );
}

export function BankAccountInfo({ bankAccountId }: { bankAccountId: string }) {
   return (
      <ErrorBoundary FallbackComponent={InfoErrorFallback}>
         <Suspense fallback={<InfoSkeleton />}>
            <BankAccountContent bankAccountId={bankAccountId} />
         </Suspense>
      </ErrorBoundary>
   );
}
