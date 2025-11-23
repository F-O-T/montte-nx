import type React from "react";
import { translate } from "@packages/localization";
import { Combobox } from "@packages/ui/components/combobox";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

interface BankAccountComboboxProps {
   value?: string;
   onValueChange?: (value: string) => void;
   onBlur?: React.FocusEventHandler<HTMLButtonElement>;
}

function BankAccountComboboxContent({
   value,
   onValueChange,
   onBlur,
}: BankAccountComboboxProps) {
   const trpc = useTRPC();
   const { data: banks = [] } = useSuspenseQuery(
      trpc.brasilApi.banks.getAll.queryOptions(),
   );

   const formattedBanks = banks.map((bank) => ({
      label: bank.fullName,
      value: bank.fullName,
   }));

   return (
      <Combobox
         emptyMessage={translate("common.form.search.no-results")}
         onBlur={onBlur}
         onValueChange={onValueChange}
         options={formattedBanks}
         placeholder={translate("common.form.bank.placeholder")}
         searchPlaceholder={translate("common.form.search.placeholder")}
         value={value}
      />
   );
}

function ErrorFallback({ error }: { error: Error }) {
   return (
      <div className="text-sm text-red-600 p-2 border rounded-md">
         {error.message}
      </div>
   );
}

function LoadingFallback() {
   return <Skeleton className="h-10 w-full" />;
}

export function BankAccountCombobox(props: BankAccountComboboxProps) {
   return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
         <Suspense fallback={<LoadingFallback />}>
            <BankAccountComboboxContent {...props} />
         </Suspense>
      </ErrorBoundary>
   );
}
