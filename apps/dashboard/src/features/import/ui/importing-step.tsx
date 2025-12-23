import { Button } from "@packages/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import {
   CheckCircle2Icon,
   ChevronRightIcon,
   Loader2Icon,
   XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTRPC } from "@/integrations/clients";
import type { BatchParsedTransaction } from "../lib/use-import-wizard";
import { createBatchRowKey } from "../lib/use-import-wizard";

interface ImportingStepProps {
   bankAccountId: string;
   transactions: BatchParsedTransaction[];
   selectedRows: Set<string>; // compound keys: "fileIndex:rowIndex"
   onComplete: () => void;
   onError: () => void;
}

export function ImportingStep({
   bankAccountId,
   transactions,
   selectedRows,
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

   const importMutation = useMutation({
      ...trpc.bankAccounts.importTransactions.mutationOptions(),
      onError: (error) => {
         console.error("Failed to import transactions:", error);
         setStatus("error");
         setResultMessage(error.message || "Erro ao importar transações");
      },
      onSuccess: (result) => {
         setTransactionCount(result.imported);
         setStatus("success");
         if (result.imported > 0) {
            setResultMessage(
               `${result.imported} ${result.imported === 1 ? "transação importada" : "transações importadas"} com sucesso!`,
            );
         } else {
            setResultMessage("Nenhuma transação foi importada");
         }
      },
   });

   useEffect(() => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      // Filter to only selected transactions and format for API
      const selectedTransactions = transactions
         .filter((t) => selectedRows.has(createBatchRowKey(t.fileIndex, t.rowIndex)))
         .map((t) => ({
            date: t.date.toISOString(),
            amount: t.amount,
            description: t.description,
            type: t.type,
            externalId: t.externalId,
         }));

      if (selectedTransactions.length === 0) {
         setStatus("error");
         setResultMessage("Nenhuma transação selecionada para importar");
         return;
      }

      importMutation.mutate({
         bankAccountId,
         transactions: selectedTransactions,
      });
   }, [bankAccountId, transactions, selectedRows, importMutation]);

   return (
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
         {status === "importing" && (
            <>
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <div className="relative p-6 rounded-full bg-primary/10">
                     <Loader2Icon className="size-12 animate-spin text-primary" />
                  </div>
               </div>
               <div className="text-center space-y-2">
                  <p className="font-medium">Importando transações...</p>
                  <p className="text-sm text-muted-foreground">
                     Isso pode levar alguns segundos
                  </p>
               </div>
            </>
         )}

         {status === "success" && (
            <>
               <div className="p-6 rounded-full bg-green-500/10">
                  <CheckCircle2Icon className="size-12 text-green-500" />
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
                     Voltar
                  </Button>
               </div>
            </>
         )}
      </div>
   );
}
