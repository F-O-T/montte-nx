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
import { Copy, ExternalLink, Globe, Mail, Phone } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";

function ContactCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar contato</AlertDescription>
      </Alert>
   );
}

function ContactCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-32" />
         </CardHeader>
         <CardContent className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
         </CardContent>
      </Card>
   );
}

function copyToClipboard(text: string) {
   navigator.clipboard.writeText(text);
   toast.success("Copiado para a área de transferência");
}

function ContactCardContent({ counterpartyId }: { counterpartyId: string }) {
   const trpc = useTRPC();

   const { data: counterparty } = useSuspenseQuery(
      trpc.counterparties.getById.queryOptions({ id: counterpartyId }),
   );

   if (!counterparty) {
      return null;
   }

   const hasContact =
      counterparty.email || counterparty.phone || counterparty.website;

   if (!hasContact) {
      return null;
   }

   return (
      <Card className="h-fit">
         <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Informações de contato</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            {counterparty.email && (
               <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                     <Mail className="size-4 text-muted-foreground shrink-0" />
                     <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <a
                           className="text-sm font-medium hover:underline truncate block"
                           href={`mailto:${counterparty.email}`}
                        >
                           {counterparty.email}
                        </a>
                     </div>
                  </div>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           className="size-7 shrink-0"
                           onClick={() => copyToClipboard(counterparty.email!)}
                           size="icon"
                           variant="ghost"
                        >
                           <Copy className="size-3.5" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Copiar e-mail</TooltipContent>
                  </Tooltip>
               </div>
            )}

            {counterparty.phone && (
               <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                     <Phone className="size-4 text-muted-foreground shrink-0" />
                     <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Telefone</p>
                        <a
                           className="text-sm font-medium hover:underline truncate block"
                           href={`tel:${counterparty.phone.replace(/\D/g, "")}`}
                        >
                           {counterparty.phone}
                        </a>
                     </div>
                  </div>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           className="size-7 shrink-0"
                           onClick={() => copyToClipboard(counterparty.phone!)}
                           size="icon"
                           variant="ghost"
                        >
                           <Copy className="size-3.5" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Copiar telefone</TooltipContent>
                  </Tooltip>
               </div>
            )}

            {counterparty.website && (
               <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                     <Globe className="size-4 text-muted-foreground shrink-0" />
                     <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Website</p>
                        <a
                           className="text-sm font-medium hover:underline truncate block"
                           href={counterparty.website}
                           rel="noopener noreferrer"
                           target="_blank"
                        >
                           {counterparty.website.replace(/^https?:\/\//, "")}
                        </a>
                     </div>
                  </div>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           asChild
                           className="size-7 shrink-0"
                           size="icon"
                           variant="ghost"
                        >
                           <a
                              href={counterparty.website}
                              rel="noopener noreferrer"
                              target="_blank"
                           >
                              <ExternalLink className="size-3.5" />
                           </a>
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>Abrir website</TooltipContent>
                  </Tooltip>
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export function CounterpartyContactCard({
   counterpartyId,
}: {
   counterpartyId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={ContactCardErrorFallback}>
         <Suspense fallback={<ContactCardSkeleton />}>
            <ContactCardContent counterpartyId={counterpartyId} />
         </Suspense>
      </ErrorBoundary>
   );
}
