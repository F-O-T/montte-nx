import { Badge } from "@packages/ui/components/badge";
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
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { CheckCircle2Icon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type CsvColumnMapping = {
   date: number | null;
   amount: number | null;
   description: number | null;
};

interface CsvColumnMapperProps {
   headers: string[];
   sampleRows: string[][];
   detectedFormat?: { id: string; name: string } | null;
   suggestedMapping?: {
      date: number | null;
      amount: number | null;
      description: number | null;
   };
   onMappingComplete: (mapping: {
      date: number;
      amount: number;
      description: number;
   }) => void;
   onBack: () => void;
}

export function CsvColumnMapper({
   headers,
   sampleRows,
   detectedFormat,
   suggestedMapping,
   onMappingComplete,
   onBack,
}: CsvColumnMapperProps) {
   const [mapping, setMapping] = useState<CsvColumnMapping>({
      date: suggestedMapping?.date ?? null,
      amount: suggestedMapping?.amount ?? null,
      description: suggestedMapping?.description ?? null,
   });

   useEffect(() => {
      if (suggestedMapping) {
         setMapping({
            date: suggestedMapping.date,
            amount: suggestedMapping.amount,
            description: suggestedMapping.description,
         });
      }
   }, [suggestedMapping]);

   const handleColumnSelect = useCallback(
      (field: keyof CsvColumnMapping, value: string) => {
         const index = value === "none" ? null : Number.parseInt(value, 10);
         setMapping((prev) => ({ ...prev, [field]: index }));
      },
      [],
   );

   const isComplete =
      mapping.date !== null &&
      mapping.amount !== null &&
      mapping.description !== null;

   const handleContinue = () => {
      if (isComplete) {
         onMappingComplete({
            date: mapping.date as number,
            amount: mapping.amount as number,
            description: mapping.description as number,
         });
      }
   };

   const getColumnHighlight = (index: number) => {
      if (mapping.date === index) return "bg-blue-500/10 border-blue-500/30";
      if (mapping.amount === index)
         return "bg-green-500/10 border-green-500/30";
      if (mapping.description === index)
         return "bg-purple-500/10 border-purple-500/30";
      return "";
   };

   return (
      <div className="space-y-6">
         {detectedFormat && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
               <SparklesIcon className="size-4 text-primary" />
               <span className="text-sm">
                  Formato detectado automaticamente:{" "}
                  <span className="font-medium">{detectedFormat.name}</span>
               </span>
            </div>
         )}

         <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
               <Label className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  Coluna de Data
               </Label>
               <Select
                  onValueChange={(v) => handleColumnSelect("date", v)}
                  value={mapping.date?.toString() ?? "none"}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">Não selecionado</SelectItem>
                     {headers.map((header, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: Headers may have duplicates, index is the unique identifier
                        <SelectItem key={index} value={index.toString()}>
                           {header || `Coluna ${index + 1}`}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <div className="space-y-2">
               <Label className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-green-500" />
                  Coluna de Valor
               </Label>
               <Select
                  onValueChange={(v) => handleColumnSelect("amount", v)}
                  value={mapping.amount?.toString() ?? "none"}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">Não selecionado</SelectItem>
                     {headers.map((header, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: Headers may have duplicates, index is the unique identifier
                        <SelectItem key={index} value={index.toString()}>
                           {header || `Coluna ${index + 1}`}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <div className="space-y-2">
               <Label className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-purple-500" />
                  Coluna de Descrição
               </Label>
               <Select
                  onValueChange={(v) => handleColumnSelect("description", v)}
                  value={mapping.description?.toString() ?? "none"}
               >
                  <SelectTrigger>
                     <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">Não selecionado</SelectItem>
                     {headers.map((header, index) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: Headers may have duplicates, index is the unique identifier
                        <SelectItem key={index} value={index.toString()}>
                           {header || `Coluna ${index + 1}`}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         </div>

         <div className="border rounded-lg overflow-hidden">
            <div className="p-3 bg-muted/50 border-b">
               <p className="text-sm font-medium">Pré-visualização dos dados</p>
               <p className="text-xs text-muted-foreground">
                  Primeiras linhas do arquivo CSV
               </p>
            </div>
            <div className="overflow-x-auto">
               <Table>
                  <TableHeader>
                     <TableRow>
                        {headers.map((header, index) => (
                           <TableHead
                              className={`whitespace-nowrap ${getColumnHighlight(index)}`}
                              key={`header-${index + 1}`}
                           >
                              <div className="flex items-center gap-2">
                                 {header || `Coluna ${index + 1}`}
                                 {mapping.date === index && (
                                    <Badge className="bg-blue-500 text-white text-[10px] px-1 py-0">
                                       Data
                                    </Badge>
                                 )}
                                 {mapping.amount === index && (
                                    <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">
                                       Valor
                                    </Badge>
                                 )}
                                 {mapping.description === index && (
                                    <Badge className="bg-purple-500 text-white text-[10px] px-1 py-0">
                                       Desc.
                                    </Badge>
                                 )}
                              </div>
                           </TableHead>
                        ))}
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {sampleRows.map((row, rowIndex) => (
                        <TableRow key={`row-${rowIndex + 1}`}>
                           {row.map((cell, cellIndex) => (
                              <TableCell
                                 className={`whitespace-nowrap ${getColumnHighlight(cellIndex)}`}
                                 key={`cell-${rowIndex + 1}-${cellIndex + 1}`}
                              >
                                 {cell || "-"}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>
         </div>

         <div className="flex items-center justify-between pt-4">
            <Button onClick={onBack} variant="ghost">
               Voltar
            </Button>
            <div className="flex items-center gap-3">
               {isComplete && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                     <CheckCircle2Icon className="size-4" />
                     Mapeamento completo
                  </span>
               )}
               <Button disabled={!isComplete} onClick={handleContinue}>
                  Continuar
               </Button>
            </div>
         </div>
      </div>
   );
}
