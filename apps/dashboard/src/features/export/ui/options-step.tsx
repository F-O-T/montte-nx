import { Button } from "@packages/ui/components/button";
import {
   Choicebox,
   ChoiceboxIndicator,
   ChoiceboxItem,
   ChoiceboxItemDescription,
   ChoiceboxItemHeader,
   ChoiceboxItemTitle,
} from "@packages/ui/components/choicebox";
import { DateRangePickerPopover } from "@packages/ui/components/date-range-picker-popover";
import { Label } from "@packages/ui/components/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Separator } from "@packages/ui/components/separator";
import { FileIcon, FileSpreadsheetIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";
import {
   EXPORT_FORMATS,
   type ExportFormat,
   type ExportOptions,
   type TransactionTypeFilter,
} from "../lib/use-export-wizard";

interface OptionsStepProps {
   initialOptions: ExportOptions;
   onBack: () => void;
   onComplete: (options: ExportOptions) => void;
}

const FORMAT_ICONS: Record<ExportFormat, React.ReactNode> = {
   ofx: <FileTextIcon className="size-5 text-blue-600" />,
   csv: <FileSpreadsheetIcon className="size-5 text-green-600" />,
   pdf: <FileIcon className="size-5 text-red-600" />,
};

export function OptionsStep({
   initialOptions,
   onBack,
   onComplete,
}: OptionsStepProps) {
   const [exportFormat, setExportFormat] = useState<ExportFormat>(
      initialOptions.format,
   );
   const [startDate, setStartDate] = useState<Date | null>(
      initialOptions.startDate,
   );
   const [endDate, setEndDate] = useState<Date | null>(initialOptions.endDate);
   const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>(
      initialOptions.typeFilter,
   );

   const handleDateRangeChange = (range: {
      startDate: Date | null;
      endDate: Date | null;
   }) => {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
   };

   const handleContinue = () => {
      onComplete({
         format: exportFormat,
         startDate,
         endDate,
         typeFilter,
      });
   };

   return (
      <div className="space-y-6">
         <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <Choicebox
               className="grid grid-cols-1 md:grid-cols-3 gap-3"
               onValueChange={(value) =>
                  setExportFormat(value as ExportFormat)
               }
               value={exportFormat}
            >
               {EXPORT_FORMATS.map((fmt) => (
                  <ChoiceboxItem
                     id={`export-format-${fmt.id}`}
                     key={fmt.id}
                     value={fmt.id}
                  >
                     {FORMAT_ICONS[fmt.id]}
                     <ChoiceboxItemHeader>
                        <ChoiceboxItemTitle>{fmt.name}</ChoiceboxItemTitle>
                        <ChoiceboxItemDescription>
                           {fmt.description}
                        </ChoiceboxItemDescription>
                     </ChoiceboxItemHeader>
                     <ChoiceboxIndicator id={`export-format-${fmt.id}`} />
                  </ChoiceboxItem>
               ))}
            </Choicebox>
         </div>

         <Separator />

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Período</Label>
               <DateRangePickerPopover
                  className="w-full"
                  endDate={endDate}
                  onRangeChange={handleDateRangeChange}
                  placeholder="Selecione o período"
                  startDate={startDate}
               />
            </div>

            <div className="space-y-2">
               <Label htmlFor="type-filter">Tipo de Transação</Label>
               <Select
                  onValueChange={(value) =>
                     setTypeFilter(value as TransactionTypeFilter)
                  }
                  value={typeFilter}
               >
                  <SelectTrigger className="w-full" id="type-filter">
                     <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Todas</SelectItem>
                     <SelectItem value="income">Receitas</SelectItem>
                     <SelectItem value="expense">Despesas</SelectItem>
                     <SelectItem value="transfer">Transferências</SelectItem>
                  </SelectContent>
               </Select>
            </div>
         </div>

         <Separator />

         <div className="flex items-center justify-between">
            <Button onClick={onBack} variant="ghost">
               Voltar
            </Button>
            <Button onClick={handleContinue}>Continuar</Button>
         </div>
      </div>
   );
}
