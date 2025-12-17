import { Button } from "@packages/ui/components/button";
import { Calendar } from "@packages/ui/components/calendar";
import { Label } from "@packages/ui/components/label";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
   CalendarIcon,
   FileIcon,
   FileSpreadsheetIcon,
   FileTextIcon,
} from "lucide-react";
import { useState } from "react";
import {
   EXPORT_FORMATS,
   type ExportFormat,
   type ExportOptions,
   type TransactionTypeFilter,
} from "../types";

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

   const formatDateDisplay = (date: Date | null) => {
      if (!date) return "Selecione uma data";
      return format(date, "dd/MM/yyyy", { locale: ptBR });
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
         <div className="space-y-4">
            <div className="space-y-3">
               <Label>Formato de Exportação</Label>
               <RadioGroup
                  className="grid grid-cols-3 gap-3"
                  onValueChange={(value) =>
                     setExportFormat(value as ExportFormat)
                  }
                  value={exportFormat}
               >
                  {EXPORT_FORMATS.map((fmt) => (
                     <Label
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                           exportFormat === fmt.id
                              ? "border-primary bg-primary/5"
                              : "border-muted"
                        }`}
                        htmlFor={fmt.id}
                        key={fmt.id}
                     >
                        <RadioGroupItem
                           className="sr-only"
                           id={fmt.id}
                           value={fmt.id}
                        />
                        {FORMAT_ICONS[fmt.id]}
                        <span className="font-medium text-sm">{fmt.name}</span>
                        <span className="text-xs text-muted-foreground text-center">
                           {fmt.description}
                        </span>
                     </Label>
                  ))}
               </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Popover>
                     <PopoverTrigger asChild>
                        <Button
                           className="w-full justify-start text-left font-normal"
                           variant="outline"
                        >
                           <CalendarIcon className="mr-2 size-4" />
                           {formatDateDisplay(startDate)}
                        </Button>
                     </PopoverTrigger>
                     <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                           locale={ptBR}
                           mode="single"
                           onSelect={(date) => setStartDate(date ?? null)}
                           selected={startDate ?? undefined}
                        />
                     </PopoverContent>
                  </Popover>
               </div>

               <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                     <PopoverTrigger asChild>
                        <Button
                           className="w-full justify-start text-left font-normal"
                           variant="outline"
                        >
                           <CalendarIcon className="mr-2 size-4" />
                           {formatDateDisplay(endDate)}
                        </Button>
                     </PopoverTrigger>
                     <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                           locale={ptBR}
                           mode="single"
                           onSelect={(date) => setEndDate(date ?? null)}
                           selected={endDate ?? undefined}
                        />
                     </PopoverContent>
                  </Popover>
               </div>
            </div>

            <div className="space-y-2">
               <Label htmlFor="type-filter">Tipo de Transação</Label>
               <Select
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
                     <SelectItem value="transfer">Transferências</SelectItem>
                  </SelectContent>
               </Select>
            </div>
         </div>

         <div className="flex items-center justify-between pt-4">
            <Button onClick={onBack} variant="ghost">
               Voltar
            </Button>
            <Button onClick={handleContinue}>Continuar</Button>
         </div>
      </div>
   );
}
