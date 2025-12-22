import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, MapPin } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

function AddressCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar endereço</AlertDescription>
      </Alert>
   );
}

function AddressCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-32" />
         </CardHeader>
         <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
         </CardContent>
      </Card>
   );
}

function copyToClipboard(text: string) {
   navigator.clipboard.writeText(text);
   toast.success("Copiado para a área de transferência");
}

function formatAddress(counterparty: {
   addressStreet?: string | null;
   addressNumber?: string | null;
   addressComplement?: string | null;
   addressNeighborhood?: string | null;
   addressCity?: string | null;
   addressState?: string | null;
   addressZipCode?: string | null;
}): string[] {
   const lines: string[] = [];

   // First line: Street, Number - Complement
   const streetParts = [];
   if (counterparty.addressStreet) {
      streetParts.push(counterparty.addressStreet);
   }
   if (counterparty.addressNumber) {
      streetParts.push(counterparty.addressNumber);
   }
   if (streetParts.length > 0) {
      let line = streetParts.join(", ");
      if (counterparty.addressComplement) {
         line += ` - ${counterparty.addressComplement}`;
      }
      lines.push(line);
   }

   // Second line: Neighborhood
   if (counterparty.addressNeighborhood) {
      lines.push(counterparty.addressNeighborhood);
   }

   // Third line: City - State - ZIP
   const locationParts = [];
   if (counterparty.addressCity) {
      locationParts.push(counterparty.addressCity);
   }
   if (counterparty.addressState) {
      locationParts.push(counterparty.addressState);
   }
   if (locationParts.length > 0) {
      let line = locationParts.join(" - ");
      if (counterparty.addressZipCode) {
         line += `, ${counterparty.addressZipCode}`;
      }
      lines.push(line);
   }

   return lines;
}

function AddressCardContent({ counterpartyId }: { counterpartyId: string }) {
   const trpc = useTRPC();

   const { data: counterparty } = useSuspenseQuery(
      trpc.counterparties.getById.queryOptions({ id: counterpartyId }),
   );

   if (!counterparty) {
      return null;
   }

   const hasAddress =
      counterparty.addressStreet ||
      counterparty.addressCity ||
      counterparty.addressZipCode;

   if (!hasAddress) {
      return null;
   }

   const addressLines = formatAddress(counterparty);
   const fullAddress = addressLines.join(", ");
   const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

   return (
      <Card className="h-fit">
         <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>Localização do parceiro</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="flex items-start justify-between gap-2">
               <div className="flex items-start gap-3 min-w-0">
                  <MapPin className="size-4 text-muted-foreground shrink-0 mt-1" />
                  <div className="min-w-0 space-y-0.5">
                     {addressLines.map((line, index) => (
                        <p
                           className={
                              index === 0
                                 ? "text-sm font-medium"
                                 : "text-sm text-muted-foreground"
                           }
                           key={`address-line-${index + 1}`}
                        >
                           {line}
                        </p>
                     ))}
                  </div>
               </div>
               <div className="flex shrink-0 gap-1">
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           className="size-7"
                           onClick={() => copyToClipboard(fullAddress)}
                           size="icon"
                           variant="ghost"
                        >
                           <Copy className="size-3.5" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Copiar endereço</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           asChild
                           className="size-7"
                           size="icon"
                           variant="ghost"
                        >
                           <a
                              href={mapsUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                           >
                              <ExternalLink className="size-3.5" />
                           </a>
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Abrir no Maps</TooltipContent>
                  </Tooltip>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}

export function CounterpartyAddressCard({
   counterpartyId,
}: {
   counterpartyId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={AddressCardErrorFallback}>
         <Suspense fallback={<AddressCardSkeleton />}>
            <AddressCardContent counterpartyId={counterpartyId} />
         </Suspense>
      </ErrorBoundary>
   );
}
