import type { TriggerType } from "@packages/database/schema";
import { Input } from "@packages/ui/components/input";
import { Label } from "@packages/ui/components/label";
import { ScrollArea } from "@packages/ui/components/scroll-area";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import { TRIGGER_TYPE_LABELS } from "../lib/types";

type AutomationSettings = {
   name: string;
   description: string;
   triggerType: TriggerType;
   isActive: boolean;
   priority: number;
   stopOnFirstMatch: boolean;
};

type AutomationSettingsFormProps = {
   settings: AutomationSettings;
   onSettingsChange: (settings: Partial<AutomationSettings>) => void;
   onTriggerTypeChange?: (triggerType: TriggerType) => void;
   mode?: "create" | "edit";
};

export function AutomationSettingsForm({
   settings,
   onSettingsChange,
   onTriggerTypeChange,
   mode = "create",
}: AutomationSettingsFormProps) {
   const handleTriggerTypeChange = (value: TriggerType) => {
      onSettingsChange({ triggerType: value });
      onTriggerTypeChange?.(value);
   };

   return (
      <>
         <SheetHeader>
            <SheetTitle>Configurações da Automação</SheetTitle>
            <SheetDescription>
               Configure os detalhes gerais da automação
            </SheetDescription>
         </SheetHeader>
         <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
               <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                     id="name"
                     onChange={(e) =>
                        onSettingsChange({ name: e.target.value })
                     }
                     placeholder="Nome da automação"
                     value={settings.name}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                     id="description"
                     onChange={(e) =>
                        onSettingsChange({ description: e.target.value })
                     }
                     placeholder="Descrição opcional"
                     rows={3}
                     value={settings.description}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="triggerType">Gatilho</Label>
                  <Select
                     onValueChange={(value) =>
                        handleTriggerTypeChange(value as TriggerType)
                     }
                     value={settings.triggerType}
                  >
                     <SelectTrigger>
                        <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                        {(
                           Object.keys(TRIGGER_TYPE_LABELS) as TriggerType[]
                        ).map((type) => (
                           <SelectItem key={type} value={type}>
                              {TRIGGER_TYPE_LABELS[type]}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Input
                     id="priority"
                     min={0}
                     onChange={(e) =>
                        onSettingsChange({ priority: Number(e.target.value) })
                     }
                     type="number"
                     value={settings.priority}
                  />
                  <p className="text-xs text-muted-foreground">
                     Automações com maior prioridade são executadas primeiro
                  </p>
               </div>

               <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                     <Label htmlFor="isActive">
                        {mode === "create" ? "Ativar após criar" : "Ativa"}
                     </Label>
                     <p className="text-xs text-muted-foreground">
                        {mode === "create"
                           ? "A automação será ativada imediatamente"
                           : "A automação está ativa e será executada"}
                     </p>
                  </div>
                  <Switch
                     checked={settings.isActive}
                     id="isActive"
                     onCheckedChange={(checked) =>
                        onSettingsChange({ isActive: checked })
                     }
                  />
               </div>

               <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                     <Label htmlFor="stopOnFirstMatch">
                        Parar na primeira correspondência
                     </Label>
                     <p className="text-xs text-muted-foreground">
                        Não executar outras automações após esta
                     </p>
                  </div>
                  <Switch
                     checked={settings.stopOnFirstMatch}
                     id="stopOnFirstMatch"
                     onCheckedChange={(checked) =>
                        onSettingsChange({ stopOnFirstMatch: checked })
                     }
                  />
               </div>
            </div>
         </ScrollArea>
      </>
   );
}
