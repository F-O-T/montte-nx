import { translate } from "@packages/localization";
import { toast } from "@packages/ui/components/sonner";
import {
   Command,
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTRPC } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";

export function CurrencyCommand() {
   const trpc = useTRPC();
   const { data } = useSuspenseQuery(trpc.preferences.get.queryOptions());
   const queryClient = useQueryClient();
   const updatePreferenceMutation = useMutation(
      trpc.preferences.update.mutationOptions({
         onError: () => {
            toast.error("Failed to update preference");
         },
         onSuccess: async () => {
            await queryClient.invalidateQueries({
               queryKey: trpc.preferences.get.queryKey(),
            });
            toast.success("Preference updated");
         },
      }),
   );

   type CurrencyOption = {
      symbol: string;
      name: string;
      value: string;
   };

   const currencyOptions = useMemo(
      (): CurrencyOption[] => [
         {
            symbol: "$",
            name: "US Dollar",
            value: "USD",
         },
         {
            symbol: "€",
            name: "Euro",
            value: "EUR",
         },
         {
            symbol: "£",
            name: "British Pound",
            value: "GBP",
         },
         {
            symbol: "¥",
            name: "Japanese Yen",
            value: "JPY",
         },
         {
            symbol: "¥",
            name: "Chinese Yuan",
            value: "CNY",
         },
         {
            symbol: "C$",
            name: "Canadian Dollar",
            value: "CAD",
         },
         {
            symbol: "A$",
            name: "Australian Dollar",
            value: "AUD",
         },
         {
            symbol: "CHF",
            name: "Swiss Franc",
            value: "CHF",
         },
      ],
      [],
   );

   const [isOpen, setIsOpen] = useState(false);

   const currentCurrencyOption = currencyOptions.find(
      (option) => option.value === data?.currency,
   );

   const handleCurrencyChange = useCallback(
      async (currencyValue: string) => {
         try {
            const currency = currencyOptions.find(
               (option) => option.value === currencyValue,
            );
            if (currency) {
               await updatePreferenceMutation.mutateAsync({
                  currency: currency.value,
               });
               setIsOpen(false);
            }
         } catch (error) {
            console.error("Failed to change currency:", error);
         }
      },
      [currencyOptions, updatePreferenceMutation],
   );

   return (
      <>
         <Button
            className="gap-2 flex items-center justify-center"
            onClick={() => setIsOpen(true)}
            variant="outline"
         >
            <span>{currentCurrencyOption?.symbol || "$"}</span>
            <span>{currentCurrencyOption?.name || "US Dollar"}</span>
         </Button>
         <CommandDialog onOpenChange={setIsOpen} open={isOpen}>
            <CommandInput
               placeholder={translate(
                  "pages.profile.features.currency-command.search",
               )}
            />
            <CommandList>
               <Command>
                  <CommandEmpty>
                     {translate(
                        "pages.profile.features.currency-command.empty",
                     )}
                  </CommandEmpty>
                  <CommandGroup>
                     {currencyOptions.map((option) => (
                        <CommandItem
                           className="flex items-center justify-start gap-2"
                           key={option.value}
                           onSelect={() => handleCurrencyChange(option.value)}
                           value={`${option.symbol} ${option.name}`}
                        >
                           <span>{option.symbol}</span>
                           <span>{option.name}</span>
                           <span className="text-muted-foreground">
                              ({option.value})
                           </span>
                           {option.value === data?.currency && (
                              <CheckCircle className="size-4 text-primary ml-auto" />
                           )}
                        </CommandItem>
                     ))}
                  </CommandGroup>
               </Command>
            </CommandList>
         </CommandDialog>
      </>
   );
}

