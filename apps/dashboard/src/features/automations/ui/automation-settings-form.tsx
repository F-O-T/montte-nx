import type { TriggerType } from "@packages/database/schema";
import { useEarlyAccessFeatures } from "@packages/posthog/client";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
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
import { useForm } from "@tanstack/react-form";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { z } from "zod";
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

const automationSettingsSchema = z.object({
   description: z.string(),
   isActive: z.boolean(),
   name: z.string().min(1, "Nome é obrigatório"),
   priority: z.number().min(0, "Prioridade deve ser maior ou igual a 0"),
   stopOnFirstMatch: z.boolean(),
   triggerType: z.enum([
      "transaction.created",
      "transaction.updated",
      "webhook.received",
   ]),
});

export function AutomationSettingsForm({
   settings,
   onSettingsChange,
   onTriggerTypeChange,
   mode = "create",
}: AutomationSettingsFormProps) {
   const {
      isEnrolled,
      updateEnrollment,
      loaded: earlyAccessLoaded,
   } = useEarlyAccessFeatures();

   const isAutomationBuilderEnrolled = isEnrolled("automation-builder");

   const form = useForm({
      defaultValues: {
         description: settings.description,
         isActive: settings.isActive,
         name: settings.name,
         priority: settings.priority,
         stopOnFirstMatch: settings.stopOnFirstMatch,
         triggerType: settings.triggerType,
      },
      validators: {
         onChange: automationSettingsSchema,
      },
   });

   useEffect(() => {
      return form.store.subscribe(() => {
         const values = form.store.state.values;
         onSettingsChange({
            description: values.description,
            isActive: values.isActive,
            name: values.name,
            priority: values.priority,
            stopOnFirstMatch: values.stopOnFirstMatch,
            triggerType: values.triggerType as TriggerType,
         });
      });
   }, [form.store, onSettingsChange]);

   const handleTriggerTypeChange = (value: TriggerType) => {
      form.setFieldValue("triggerType", value);
      onTriggerTypeChange?.(value);
   };

   const handleEarlyAccessToggle = (checked: boolean) => {
      updateEnrollment("automation-builder", checked);
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
               <FieldGroup>
                  <form.Field name="name">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Nome *
                              </FieldLabel>
                              <Input
                                 id={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(e.target.value)
                                 }
                                 placeholder="Nome da automação"
                                 value={field.state.value}
                              />
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>
               </FieldGroup>

               <FieldGroup>
                  <form.Field name="description">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>
                              Descrição
                           </FieldLabel>
                           <Textarea
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder="Descrição opcional"
                              rows={3}
                              value={field.state.value}
                           />
                           <FieldDescription>
                              Uma descrição ajuda a identificar o propósito da
                              automação
                           </FieldDescription>
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>

               <FieldGroup>
                  <form.Field name="triggerType">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Gatilho</FieldLabel>
                           <Select
                              onValueChange={(value) =>
                                 handleTriggerTypeChange(value as TriggerType)
                              }
                              value={field.state.value}
                           >
                              <SelectTrigger id={field.name}>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {(
                                    Object.keys(
                                       TRIGGER_TYPE_LABELS,
                                    ) as TriggerType[]
                                 ).map((type) => (
                                    <SelectItem key={type} value={type}>
                                       {TRIGGER_TYPE_LABELS[type]}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                           <FieldDescription>
                              O evento que dispara esta automação
                           </FieldDescription>
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>

               <FieldGroup>
                  <form.Field name="priority">
                     {(field) => {
                        const isInvalid =
                           field.state.meta.isTouched &&
                           !field.state.meta.isValid;
                        return (
                           <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                 Prioridade
                              </FieldLabel>
                              <Input
                                 id={field.name}
                                 min={0}
                                 onBlur={field.handleBlur}
                                 onChange={(e) =>
                                    field.handleChange(Number(e.target.value))
                                 }
                                 type="number"
                                 value={field.state.value}
                              />
                              <FieldDescription>
                                 Automações com maior prioridade são executadas
                                 primeiro
                              </FieldDescription>
                              {isInvalid && (
                                 <FieldError errors={field.state.meta.errors} />
                              )}
                           </Field>
                        );
                     }}
                  </form.Field>
               </FieldGroup>

               <div className="flex items-center justify-between rounded-md border p-3">
                  <form.Field name="isActive">
                     {(field) => (
                        <>
                           <div>
                              <FieldLabel htmlFor={field.name}>
                                 {mode === "create"
                                    ? "Ativar após criar"
                                    : "Ativa"}
                              </FieldLabel>
                              <p className="text-xs text-muted-foreground">
                                 {mode === "create"
                                    ? "A automação será ativada imediatamente"
                                    : "A automação está ativa e será executada"}
                              </p>
                           </div>
                           <Switch
                              checked={field.state.value}
                              id={field.name}
                              onCheckedChange={(checked) =>
                                 field.handleChange(checked)
                              }
                           />
                        </>
                     )}
                  </form.Field>
               </div>

               <div className="flex items-center justify-between rounded-md border p-3">
                  <form.Field name="stopOnFirstMatch">
                     {(field) => (
                        <>
                           <div>
                              <FieldLabel htmlFor={field.name}>
                                 Parar na primeira correspondência
                              </FieldLabel>
                              <p className="text-xs text-muted-foreground">
                                 Não executar outras automações após esta
                              </p>
                           </div>
                           <Switch
                              checked={field.state.value}
                              id={field.name}
                              onCheckedChange={(checked) =>
                                 field.handleChange(checked)
                              }
                           />
                        </>
                     )}
                  </form.Field>
               </div>

               {earlyAccessLoaded && (
                  <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 p-3">
                     <div className="flex items-start gap-3">
                        <Sparkles className="mt-0.5 size-4 text-primary" />
                        <div>
                           <p className="text-sm font-medium">
                              Novo Editor Visual
                           </p>
                           <p className="text-xs text-muted-foreground">
                              Experimente o novo construtor de automações com
                              interface visual
                           </p>
                        </div>
                     </div>
                     <Switch
                        checked={isAutomationBuilderEnrolled}
                        onCheckedChange={handleEarlyAccessToggle}
                     />
                  </div>
               )}
            </div>
         </ScrollArea>
      </>
   );
}
