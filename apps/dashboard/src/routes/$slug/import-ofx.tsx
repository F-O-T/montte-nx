import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
   ArrowLeftIcon,
   Building2,
   CheckCircle2,
   ChevronLeftIcon,
   ChevronRightIcon,
   FileSpreadsheet,
   Loader2,
   XIcon,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { usePendingOfxImport } from "@/hooks/use-pending-ofx-import";
import { useTRPC } from "@/integrations/clients";

type StepId = "select-account" | "importing";

const allSteps: StepId[] = ["select-account", "importing"];

const searchSchema = z.object({
   bankAccountId: z.string().optional(),
   step: z
      .enum(["select-account", "importing"])
      .optional()
      .default("select-account"),
});

export const Route = createFileRoute("/$slug/import-ofx")({
   component: RouteComponent,
   validateSearch: searchSchema,
});

function RouteComponent() {
   const navigate = useNavigate({ from: "/$slug/import-ofx" });
   const { slug } = Route.useParams();
   const { step, bankAccountId } = Route.useSearch();
   const { getPending, clearPending } = usePendingOfxImport();

   const [pendingFile, setPendingFile] = useState<{
      content: string;
      filename: string;
   } | null>(null);

   useEffect(() => {
      const pending = getPending();
      if (pending) {
         setPendingFile({
            content: pending.content,
            filename: pending.filename,
         });
      } else {
         toast.error("Nenhum arquivo OFX encontrado para importar");
         navigate({ params: { slug }, to: "/$slug/home" });
      }
   }, [getPending, navigate, slug]);

   const currentStepIndex = allSteps.indexOf(step);
   const totalSteps = allSteps.length;

   const handleCancel = () => {
      clearPending();
      navigate({ params: { slug }, to: "/$slug/home" });
   };

   const handleSelectAccount = (accountId: string) => {
      navigate({
         params: { slug },
         search: { bankAccountId: accountId, step: "importing" },
      });
   };

   const handleImportComplete = () => {
      clearPending();
      if (bankAccountId) {
         navigate({
            params: { bankAccountId, slug },
            to: "/$slug/bank-accounts/$bankAccountId",
         });
      } else {
         navigate({ params: { slug }, to: "/$slug/home" });
      }
   };

   const handleBack = () => {
      if (step === "importing") {
         navigate({
            params: { slug },
            search: { step: "select-account" },
         });
      } else {
         handleCancel();
      }
   };

   const getStepTitle = () => {
      switch (step) {
         case "select-account":
            return "Selecione a conta bancária";
         case "importing":
            return "Importando transações";
         default:
            return "";
      }
   };

   const getStepDescription = () => {
      switch (step) {
         case "select-account":
            return pendingFile
               ? `Escolha a conta para importar "${pendingFile.filename}"`
               : "Escolha a conta para importar o arquivo OFX";
         case "importing":
            return "Processando o arquivo e criando as transações...";
         default:
            return "";
      }
   };

   const StepIndicator = () => (
      <div className="flex items-center gap-4">
         <div className="flex items-center gap-1.5">
            {allSteps.map((stepId, index) => (
               <div
                  className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                     index <= currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                  key={stepId}
               />
            ))}
         </div>
         <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentStepIndex + 1} de {totalSteps}
         </span>
      </div>
   );

   if (!pendingFile) {
      return (
         <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
         </div>
      );
   }

   return (
      <div className="min-h-screen flex flex-col">
         <header className="p-4 border-b">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
               <Button
                  className="gap-2"
                  onClick={handleCancel}
                  size="sm"
                  variant="ghost"
               >
                  <XIcon className="size-4" />
                  Cancelar
               </Button>
               <StepIndicator />
               <div className="w-20" />
            </div>
         </header>

         <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl space-y-8">
               <div className="text-center space-y-2">
                  <div className="flex justify-center mb-4">
                     <div className="p-4 rounded-full bg-primary/10">
                        <FileSpreadsheet className="size-8 text-primary" />
                     </div>
                  </div>
                  <h1 className="text-3xl font-semibold font-serif">
                     {getStepTitle()}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                     {getStepDescription()}
                  </p>
               </div>

               <div className="space-y-4">
                  {step === "select-account" && (
                     <Suspense fallback={<BankAccountsListSkeleton />}>
                        <BankAccountsList onSelect={handleSelectAccount} />
                     </Suspense>
                  )}

                  {step === "importing" && bankAccountId && pendingFile && (
                     <ImportingStep
                        bankAccountId={bankAccountId}
                        fileContent={pendingFile.content}
                        filename={pendingFile.filename}
                        onComplete={handleImportComplete}
                        onError={handleBack}
                     />
                  )}
               </div>
            </div>
         </div>

         <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-2xl mx-auto p-4 flex items-center justify-between">
               <Button className="gap-2" onClick={handleBack} variant="ghost">
                  <ChevronLeftIcon className="size-4" />
                  {step === "select-account" ? "Cancelar" : "Voltar"}
               </Button>

               <div className="flex items-center gap-2">
                  {step === "select-account" && (
                     <p className="text-sm text-muted-foreground">
                        Selecione uma conta acima
                     </p>
                  )}
               </div>
            </div>
         </footer>
      </div>
   );
}

function BankAccountsListSkeleton() {
   return (
      <div className="space-y-3">
         {[1, 2, 3].map((i) => (
            <Skeleton className="h-20 w-full rounded-lg" key={i} />
         ))}
      </div>
   );
}

type BankAccountsListProps = {
   onSelect: (accountId: string) => void;
};

function BankAccountsList({ onSelect }: BankAccountsListProps) {
   const trpc = useTRPC();
   const { data: bankAccounts } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const activeAccounts = bankAccounts.filter(
      (account) => account.status === "active",
   );

   if (activeAccounts.length === 0) {
      return (
         <div className="text-center py-8">
            <Building2 className="size-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
               Nenhuma conta bancária encontrada.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
               Crie uma conta bancária primeiro para importar transações.
            </p>
         </div>
      );
   }

   return (
      <div className="space-y-3">
         {activeAccounts.map((account) => (
            <button
               className="w-full text-left"
               key={account.id}
               onClick={() => onSelect(account.id)}
               type="button"
            >
               <Item
                  className="cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all"
                  variant="outline"
               >
                  <ItemMedia variant="icon">
                     <Building2 className="size-6" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>{account.name || "Conta sem nome"}</ItemTitle>
                     <ItemDescription>
                        {account.bank}
                        {account.type ? ` • ${account.type}` : ""}
                     </ItemDescription>
                  </ItemContent>
                  <ChevronRightIcon className="size-5 text-muted-foreground" />
               </Item>
            </button>
         ))}
      </div>
   );
}

type ImportingStepProps = {
   bankAccountId: string;
   fileContent: string;
   filename: string;
   onComplete: () => void;
   onError: () => void;
};

function ImportingStep({
   bankAccountId,
   fileContent,
   filename,
   onComplete,
   onError,
}: ImportingStepProps) {
   const trpc = useTRPC();
   const [status, setStatus] = useState<"importing" | "success" | "error">(
      "importing",
   );
   const [resultMessage, setResultMessage] = useState("");
   const [transactionCount, setTransactionCount] = useState(0);
   const hasStartedRef = useRef(false);

   const parseOfxMutation = useMutation(
      trpc.bankAccounts.parseOfx.mutationOptions({
         onError: (error) => {
            console.error("Failed to parse OFX:", error);
            setStatus("error");
            setResultMessage(error.message || "Erro ao importar arquivo");
         },
         onSuccess: (result) => {
            setTransactionCount(result.length);
            setStatus("success");
            if (result.length > 0) {
               setResultMessage(
                  `${result.length} ${result.length === 1 ? "transação importada" : "transações importadas"} com sucesso!`,
               );
            } else {
               setResultMessage(
                  "Nenhuma transação nova encontrada (possíveis duplicatas)",
               );
            }
         },
      }),
   );

   useEffect(() => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      parseOfxMutation.mutate({
         bankAccountId,
         content: fileContent,
      });
   }, [bankAccountId, fileContent, parseOfxMutation]);

   return (
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
         {status === "importing" && (
            <>
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative p-6 rounded-full bg-primary/10">
                     <Loader2 className="size-12 animate-spin text-primary" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <p className="font-medium">Importando "{filename}"...</p>
                  <p className="text-sm text-muted-foreground">
                     Isso pode levar alguns segundos
                  </p>
               </div>
            </>
         )}

         {status === "success" && (
            <>
               <div className="p-6 rounded-full bg-green-500/10">
                  <CheckCircle2 className="size-12 text-green-500" />
               </div>
               <div className="text-center space-y-2">
                  <p className="font-medium text-green-600">{resultMessage}</p>
                  {transactionCount > 0 && (
                     <p className="text-sm text-muted-foreground">
                        As transações foram adicionadas à sua conta
                     </p>
                  )}
               </div>
               <Button className="gap-2" onClick={onComplete}>
                  Ver transações
                  <ChevronRightIcon className="size-4" />
               </Button>
            </>
         )}

         {status === "error" && (
            <>
               <div className="p-6 rounded-full bg-destructive/10">
                  <XIcon className="size-12 text-destructive" />
               </div>
               <div className="text-center space-y-2">
                  <p className="font-medium text-destructive">
                     Erro ao importar
                  </p>
                  <p className="text-sm text-muted-foreground">
                     {resultMessage}
                  </p>
               </div>
               <div className="flex gap-2">
                  <Button onClick={onError} variant="outline">
                     <ArrowLeftIcon className="size-4 mr-2" />
                     Escolher outra conta
                  </Button>
               </div>
            </>
         )}
      </div>
   );
}
