import { Button } from "@packages/ui/components/button";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { useMutation } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type TransactionTypeFilter = "all" | "income" | "expense" | "transfer";

type ExportOfxFormProps = {
   bankAccountId: string;
   startDate: Date | null;
   endDate: Date | null;
};

export function ExportOfxForm({
   bankAccountId,
   startDate,
   endDate,
}: ExportOfxFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");

   const exportOfxMutation = useMutation(
      trpc.bankAccounts.exportOfx.mutationOptions({
         onError: (error) => {
            console.error("Failed to export OFX:", error);
            toast.error("Erro ao exportar OFX");
         },
         onSuccess: (data) => {
            const blob = new Blob([data.content], {
               type: "application/x-ofx",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = data.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (data.transactionCount > 0) {
               toast.success(
                  `${data.transactionCount} transacoes exportadas com sucesso`,
               );
            } else {
               toast.info(
                  "Nenhuma transacao encontrada no periodo selecionado",
               );
            }
            closeSheet();
         },
      }),
   );

   const handleExport = async () => {
      exportOfxMutation.mutate({
         bankAccountId,
         endDate: endDate?.toISOString(),
         startDate: startDate?.toISOString(),
         type: typeFilter === "all" ? undefined : typeFilter,
      });
   };

   const isExporting = exportOfxMutation.isPending;

   const formatDateRange = () => {
      if (!startDate && !endDate) {
         return "Todas as transacoes";
      }
      const formatDate = (d: Date) =>
         d.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
         });
      if (startDate && endDate) {
         return `${formatDate(startDate)} - ${formatDate(endDate)}`;
      }
      if (startDate) {
         return `A partir de ${formatDate(startDate)}`;
      }
      if (endDate) {
         return `Ate ${formatDate(endDate)}`;
      }
      return "Todas as transacoes";
   };

   return (
      <>
         <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
               <FileSpreadsheet className="size-5" />
               Exportar OFX
            </SheetTitle>
            <SheetDescription>
               Exporte as transacoes da conta bancaria para um arquivo OFX. O
               arquivo pode ser importado em outros sistemas financeiros.
            </SheetDescription>
         </SheetHeader>

         <div className="flex-1 space-y-6 px-4">
            <div className="space-y-2">
               <Label className="text-sm font-medium">Periodo</Label>
               <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-sm">{formatDateRange()}</p>
                  <p className="text-muted-foreground text-xs mt-1">
                     Use os filtros da pagina para alterar o periodo
                  </p>
               </div>
            </div>

            <div className="space-y-2">
               <Label htmlFor="type-filter">Tipo de transacao</Label>
               <Select
                  disabled={isExporting}
                  onValueChange={(value) =>
                     setTypeFilter(value as TransactionTypeFilter)
                  }
                  value={typeFilter}
               >
                  <SelectTrigger id="type-filter">
                     <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todas</SelectItem>
                     <SelectItem value="income">Receitas</SelectItem>
                     <SelectItem value="expense">Despesas</SelectItem>
                     <SelectItem value="transfer">Transferencias</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
               <p className="text-blue-800 text-sm dark:text-blue-200">
                  O arquivo OFX exportado pode ser importado em softwares de
                  gestao financeira como Microsoft Money, Quicken, GnuCash,
                  entre outros.
               </p>
            </div>
         </div>

         <SheetFooter className="px-4">
            <Button
               className="w-full"
               disabled={isExporting}
               onClick={handleExport}
            >
               {isExporting ? (
                  <>
                     <Loader2 className="mr-2 size-4 animate-spin" />
                     Exportando...
                  </>
               ) : (
                  <>
                     <Download className="mr-2 size-4" />
                     Exportar OFX
                  </>
               )}
            </Button>
         </SheetFooter>
      </>
   );
}
