import type { ActionType, TriggerType } from "@packages/database/schema";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import {
   Field,
   FieldDescription,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
import { MultiSelect } from "@packages/ui/components/multi-select";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { Textarea } from "@packages/ui/components/textarea";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Tag, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useTRPC } from "@/integrations/clients";
import type {
   ActionNodeData,
   AutomationNode,
   ConditionNodeData,
   TriggerNodeData,
} from "../lib/types";
import {
   ACTION_TYPE_LABELS,
   CONDITION_OPERATOR_LABELS,
   TRANSACTION_FIELDS,
   TRIGGER_TYPE_LABELS,
} from "../lib/types";

type NodeConfigurationPanelProps = {
   node: AutomationNode | null;
   onClose: () => void;
   onUpdate: (nodeId: string, data: Partial<AutomationNode["data"]>) => void;
};

export function NodeConfigurationPanel({
   node,
   onClose: _onClose,
   onUpdate,
}: NodeConfigurationPanelProps) {
   if (!node) return null;

   return (
      <div className="space-y-4">
         {node.type === "trigger" && (
            <TriggerConfigurationForm
               data={node.data as TriggerNodeData}
               nodeId={node.id}
               onUpdate={onUpdate}
            />
         )}
         {node.type === "condition" && (
            <ConditionConfigurationForm
               data={node.data as ConditionNodeData}
               nodeId={node.id}
               onUpdate={onUpdate}
            />
         )}
         {node.type === "action" && (
            <ActionConfigurationForm
               data={node.data as ActionNodeData}
               nodeId={node.id}
               onUpdate={onUpdate}
            />
         )}
      </div>
   );
}

type TriggerConfigurationFormProps = {
   nodeId: string;
   data: TriggerNodeData;
   onUpdate: (nodeId: string, data: Partial<TriggerNodeData>) => void;
};

function TriggerConfigurationForm({
   nodeId,
   data,
   onUpdate,
}: TriggerConfigurationFormProps) {
   const form = useForm({
      defaultValues: {
         label: data.label,
         triggerType: data.triggerType,
      },
   });

   useEffect(() => {
      form.setFieldValue("label", data.label);
      form.setFieldValue("triggerType", data.triggerType);
   }, [data, form]);

   const handleFieldChange = useCallback(
      (field: string, value: unknown) => {
         onUpdate(nodeId, { [field]: value });
      },
      [nodeId, onUpdate],
   );

   return (
      <div className="space-y-4">
         <FieldGroup>
            <form.Field name="label">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>Rótulo</FieldLabel>
                     <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                           field.handleChange(e.target.value);
                           handleFieldChange("label", e.target.value);
                        }}
                        value={field.state.value}
                     />
                  </Field>
               )}
            </form.Field>
         </FieldGroup>

         <FieldGroup>
            <form.Field name="triggerType">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>
                        Tipo de Gatilho
                     </FieldLabel>
                     <Select
                        onValueChange={(value) => {
                           field.handleChange(value as TriggerType);
                           handleFieldChange("triggerType", value);
                        }}
                        value={field.state.value}
                     >
                        <SelectTrigger id={field.name}>
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
                  </Field>
               )}
            </form.Field>
         </FieldGroup>
      </div>
   );
}

type ConditionConfigurationFormProps = {
   nodeId: string;
   data: ConditionNodeData;
   onUpdate: (nodeId: string, data: Partial<ConditionNodeData>) => void;
};

function ConditionConfigurationForm({
   nodeId,
   data,
   onUpdate,
}: ConditionConfigurationFormProps) {
   const form = useForm({
      defaultValues: {
         label: data.label,
         operator: data.operator,
      },
   });

   useEffect(() => {
      form.setFieldValue("label", data.label);
      form.setFieldValue("operator", data.operator);
   }, [data.label, data.operator, form]);

   const handleFieldChange = useCallback(
      (field: string, value: unknown) => {
         onUpdate(nodeId, { [field]: value });
      },
      [nodeId, onUpdate],
   );

   const handleAddCondition = useCallback(() => {
      const newCondition = {
         field: "description",
         id: crypto.randomUUID(),
         operator: "contains" as const,
         value: "",
      };
      onUpdate(nodeId, { conditions: [...data.conditions, newCondition] });
   }, [nodeId, data.conditions, onUpdate]);

   const handleRemoveCondition = useCallback(
      (conditionId: string) => {
         onUpdate(nodeId, {
            conditions: data.conditions.filter((c) => c.id !== conditionId),
         });
      },
      [nodeId, data.conditions, onUpdate],
   );

   const handleConditionFieldChange = useCallback(
      (conditionId: string, field: string) => {
         onUpdate(nodeId, {
            conditions: data.conditions.map((c) =>
               c.id === conditionId ? { ...c, field } : c,
            ),
         });
      },
      [nodeId, data.conditions, onUpdate],
   );

   const handleConditionOperatorChange = useCallback(
      (conditionId: string, operator: string) => {
         onUpdate(nodeId, {
            conditions: data.conditions.map((c) =>
               c.id === conditionId
                  ? { ...c, operator: operator as typeof c.operator }
                  : c,
            ),
         });
      },
      [nodeId, data.conditions, onUpdate],
   );

   const handleConditionValueChange = useCallback(
      (conditionId: string, value: string) => {
         onUpdate(nodeId, {
            conditions: data.conditions.map((c) =>
               c.id === conditionId ? { ...c, value } : c,
            ),
         });
      },
      [nodeId, data.conditions, onUpdate],
   );

   return (
      <div className="space-y-4">
         <FieldGroup>
            <form.Field name="label">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>Rótulo</FieldLabel>
                     <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                           field.handleChange(e.target.value);
                           handleFieldChange("label", e.target.value);
                        }}
                        value={field.state.value}
                     />
                  </Field>
               )}
            </form.Field>
         </FieldGroup>

         <FieldGroup>
            <form.Field name="operator">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>
                        Operador Lógico
                     </FieldLabel>
                     <Select
                        onValueChange={(value) => {
                           field.handleChange(value as "AND" | "OR");
                           handleFieldChange("operator", value);
                        }}
                        value={field.state.value}
                     >
                        <SelectTrigger id={field.name}>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="AND">
                              E (todas devem corresponder)
                           </SelectItem>
                           <SelectItem value="OR">
                              OU (qualquer pode corresponder)
                           </SelectItem>
                        </SelectContent>
                     </Select>
                  </Field>
               )}
            </form.Field>
         </FieldGroup>

         <div className="space-y-2">
            <div className="flex items-center justify-between">
               <FieldLabel>Condições</FieldLabel>
               <Button onClick={handleAddCondition} size="sm" variant="outline">
                  Adicionar
               </Button>
            </div>
            {data.conditions.map((condition) => (
               <div
                  className="space-y-2 rounded-md border p-2"
                  key={condition.id}
               >
                  <div className="flex items-center justify-between">
                     <span className="text-xs text-muted-foreground">
                        Condição
                     </span>
                     <Button
                        className="size-6"
                        onClick={() => handleRemoveCondition(condition.id)}
                        size="icon"
                        variant="ghost"
                     >
                        <X className="size-3" />
                     </Button>
                  </div>
                  <Select
                     onValueChange={(v) =>
                        handleConditionFieldChange(condition.id, v)
                     }
                     value={condition.field}
                  >
                     <SelectTrigger className="h-8">
                        <SelectValue placeholder="Campo" />
                     </SelectTrigger>
                     <SelectContent>
                        {TRANSACTION_FIELDS.map((field) => (
                           <SelectItem key={field.value} value={field.value}>
                              {field.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                  <Select
                     onValueChange={(v) =>
                        handleConditionOperatorChange(condition.id, v)
                     }
                     value={condition.operator}
                  >
                     <SelectTrigger className="h-8">
                        <SelectValue placeholder="Operador" />
                     </SelectTrigger>
                     <SelectContent>
                        {Object.entries(CONDITION_OPERATOR_LABELS).map(
                           ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                 {label}
                              </SelectItem>
                           ),
                        )}
                     </SelectContent>
                  </Select>
                  <Input
                     className="h-8"
                     onChange={(e) =>
                        handleConditionValueChange(condition.id, e.target.value)
                     }
                     placeholder="Valor"
                     value={String(condition.value ?? "")}
                  />
               </div>
            ))}
         </div>
      </div>
   );
}

type ActionConfigurationFormProps = {
   nodeId: string;
   data: ActionNodeData;
   onUpdate: (nodeId: string, data: Partial<ActionNodeData>) => void;
};

function ActionConfigurationForm({
   nodeId,
   data,
   onUpdate,
}: ActionConfigurationFormProps) {
   const trpc = useTRPC();

   const { data: tags = [], isLoading: tagsLoading } = useQuery(
      trpc.tags.getAll.queryOptions(),
   );
   const { data: categories = [], isLoading: categoriesLoading } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );
   const { data: costCenters = [], isLoading: costCentersLoading } = useQuery(
      trpc.costCenters.getAll.queryOptions(),
   );

   const form = useForm({
      defaultValues: {
         actionType: data.actionType,
         body: (data.config.body as string) ?? "",
         categoryId: (data.config.categoryId as string) ?? "",
         continueOnError: data.continueOnError ?? false,
         costCenterId: (data.config.costCenterId as string) ?? "",
         customEmail: (data.config.customEmail as string) ?? "",
         label: data.label,
         mode: (data.config.mode as string) ?? "replace",
         reason: (data.config.reason as string) ?? "",
         subject: (data.config.subject as string) ?? "",
         tagIds: (data.config.tagIds as string[]) ?? [],
         title: (data.config.title as string) ?? "",
         to: (data.config.to as string) ?? "owner",
         value: (data.config.value as string) ?? "",
      },
   });

   useEffect(() => {
      form.setFieldValue("label", data.label);
      form.setFieldValue("actionType", data.actionType);
      form.setFieldValue("continueOnError", data.continueOnError ?? false);
      form.setFieldValue("tagIds", (data.config.tagIds as string[]) ?? []);
      form.setFieldValue(
         "categoryId",
         (data.config.categoryId as string) ?? "",
      );
      form.setFieldValue(
         "costCenterId",
         (data.config.costCenterId as string) ?? "",
      );
      form.setFieldValue("mode", (data.config.mode as string) ?? "replace");
      form.setFieldValue("value", (data.config.value as string) ?? "");
      form.setFieldValue("title", (data.config.title as string) ?? "");
      form.setFieldValue("body", (data.config.body as string) ?? "");
      form.setFieldValue("to", (data.config.to as string) ?? "owner");
      form.setFieldValue(
         "customEmail",
         (data.config.customEmail as string) ?? "",
      );
      form.setFieldValue("subject", (data.config.subject as string) ?? "");
      form.setFieldValue("reason", (data.config.reason as string) ?? "");
   }, [data, form]);

   const handleFieldChange = useCallback(
      (field: string, value: unknown) => {
         if (field === "label" || field === "continueOnError") {
            onUpdate(nodeId, { [field]: value });
         } else if (field === "actionType") {
            onUpdate(nodeId, { actionType: value as ActionType, config: {} });
         } else {
            onUpdate(nodeId, { config: { ...data.config, [field]: value } });
         }
      },
      [nodeId, data.config, onUpdate],
   );

   const tagOptions = tags.map((tag) => ({
      icon: <Tag className="size-4" style={{ color: tag.color }} />,
      label: tag.name,
      value: tag.id,
   }));

   const categoryOptions = categories.map((category) => ({
      icon: (
         <div
            className="flex size-4 items-center justify-center rounded"
            style={{ backgroundColor: category.color }}
         >
            <IconDisplay iconName={category.icon as IconName} size={10} />
         </div>
      ),
      label: category.name,
      value: category.id,
   }));

   const costCenterOptions = [
      { label: "Nenhum", value: "" },
      ...costCenters.map((cc) => ({
         label: cc.code ? `${cc.name} (${cc.code})` : cc.name,
         value: cc.id,
      })),
   ];

   return (
      <div className="space-y-4">
         <FieldGroup>
            <form.Field name="label">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>Rótulo</FieldLabel>
                     <Input
                        id={field.name}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                           field.handleChange(e.target.value);
                           handleFieldChange("label", e.target.value);
                        }}
                        value={field.state.value}
                     />
                  </Field>
               )}
            </form.Field>
         </FieldGroup>

         <FieldGroup>
            <form.Field name="actionType">
               {(field) => (
                  <Field>
                     <FieldLabel htmlFor={field.name}>Tipo de Ação</FieldLabel>
                     <Select
                        onValueChange={(value) => {
                           field.handleChange(value as ActionType);
                           handleFieldChange("actionType", value);
                        }}
                        value={field.state.value}
                     >
                        <SelectTrigger id={field.name}>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {(
                              Object.keys(ACTION_TYPE_LABELS) as ActionType[]
                           ).map((type) => (
                              <SelectItem key={type} value={type}>
                                 {ACTION_TYPE_LABELS[type]}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </Field>
               )}
            </form.Field>
         </FieldGroup>

         {(data.actionType === "add_tag" ||
            data.actionType === "remove_tag") && (
            <FieldGroup>
               <form.Field name="tagIds">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           {data.actionType === "add_tag"
                              ? "Tags para adicionar"
                              : "Tags para remover"}
                        </FieldLabel>
                        {tagsLoading ? (
                           <Skeleton className="h-10 w-full" />
                        ) : (
                           <MultiSelect
                              className="w-full"
                              emptyMessage="Nenhuma tag encontrada"
                              onChange={(val) => {
                                 field.handleChange(val);
                                 handleFieldChange("tagIds", val);
                              }}
                              options={tagOptions}
                              placeholder="Selecione as tags..."
                              selected={field.state.value}
                           />
                        )}
                        <FieldDescription>
                           {data.actionType === "add_tag"
                              ? "Selecione as tags que serão adicionadas à transação"
                              : "Selecione as tags que serão removidas da transação"}
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         )}

         {data.actionType === "set_category" && (
            <FieldGroup>
               <form.Field name="categoryId">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>Categoria</FieldLabel>
                        {categoriesLoading ? (
                           <Skeleton className="h-10 w-full" />
                        ) : (
                           <Combobox
                              className="w-full"
                              emptyMessage="Nenhuma categoria encontrada"
                              onValueChange={(value) => {
                                 field.handleChange(value);
                                 handleFieldChange("categoryId", value);
                              }}
                              options={categoryOptions}
                              placeholder="Selecione a categoria..."
                              searchPlaceholder="Buscar categoria..."
                              value={field.state.value}
                           />
                        )}
                        <FieldDescription>
                           A categoria que será definida para a transação
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         )}

         {data.actionType === "set_cost_center" && (
            <FieldGroup>
               <form.Field name="costCenterId">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>
                           Centro de Custo
                        </FieldLabel>
                        {costCentersLoading ? (
                           <Skeleton className="h-10 w-full" />
                        ) : (
                           <Combobox
                              className="w-full"
                              emptyMessage="Nenhum centro de custo encontrado"
                              onValueChange={(value) => {
                                 field.handleChange(value);
                                 handleFieldChange("costCenterId", value);
                              }}
                              options={costCenterOptions}
                              placeholder="Selecione o centro de custo..."
                              searchPlaceholder="Buscar centro de custo..."
                              value={field.state.value}
                           />
                        )}
                        <FieldDescription>
                           O centro de custo que será definido para a transação
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         )}

         {data.actionType === "update_description" && (
            <>
               <FieldGroup>
                  <form.Field name="mode">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Modo</FieldLabel>
                           <Select
                              onValueChange={(v) => {
                                 field.handleChange(v);
                                 handleFieldChange("mode", v);
                              }}
                              value={field.state.value}
                           >
                              <SelectTrigger id={field.name}>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="replace">
                                    Substituir
                                 </SelectItem>
                                 <SelectItem value="append">
                                    Adicionar ao final
                                 </SelectItem>
                                 <SelectItem value="prepend">
                                    Adicionar ao início
                                 </SelectItem>
                              </SelectContent>
                           </Select>
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
               <FieldGroup>
                  <form.Field name="value">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Valor</FieldLabel>
                           <Textarea
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                 field.handleChange(e.target.value);
                                 handleFieldChange("value", e.target.value);
                              }}
                              placeholder="Nova descrição ou padrão"
                              value={field.state.value}
                           />
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
            </>
         )}

         {data.actionType === "send_push_notification" && (
            <>
               <FieldGroup>
                  <form.Field name="title">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Título</FieldLabel>
                           <Input
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                 field.handleChange(e.target.value);
                                 handleFieldChange("title", e.target.value);
                              }}
                              placeholder="Título da notificação"
                              value={field.state.value}
                           />
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
               <FieldGroup>
                  <form.Field name="body">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Corpo</FieldLabel>
                           <Textarea
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                 field.handleChange(e.target.value);
                                 handleFieldChange("body", e.target.value);
                              }}
                              placeholder="Corpo da notificação"
                              value={field.state.value}
                           />
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
            </>
         )}

         {data.actionType === "send_email" && (
            <>
               <FieldGroup>
                  <form.Field name="to">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Para</FieldLabel>
                           <Select
                              onValueChange={(v) => {
                                 field.handleChange(v);
                                 handleFieldChange("to", v);
                              }}
                              value={field.state.value}
                           >
                              <SelectTrigger id={field.name}>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="owner">
                                    Proprietário da Organização
                                 </SelectItem>
                                 <SelectItem value="custom">
                                    E-mail Personalizado
                                 </SelectItem>
                              </SelectContent>
                           </Select>
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
               {data.config.to === "custom" && (
                  <FieldGroup>
                     <form.Field name="customEmail">
                        {(field) => (
                           <Field>
                              <FieldLabel htmlFor={field.name}>
                                 E-mail Personalizado
                              </FieldLabel>
                              <Input
                                 id={field.name}
                                 onBlur={field.handleBlur}
                                 onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    handleFieldChange(
                                       "customEmail",
                                       e.target.value,
                                    );
                                 }}
                                 placeholder="email@exemplo.com"
                                 value={field.state.value}
                              />
                           </Field>
                        )}
                     </form.Field>
                  </FieldGroup>
               )}
               <FieldGroup>
                  <form.Field name="subject">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Assunto</FieldLabel>
                           <Input
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                 field.handleChange(e.target.value);
                                 handleFieldChange("subject", e.target.value);
                              }}
                              placeholder="Assunto do e-mail"
                              value={field.state.value}
                           />
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
               <FieldGroup>
                  <form.Field name="body">
                     {(field) => (
                        <Field>
                           <FieldLabel htmlFor={field.name}>Corpo</FieldLabel>
                           <Textarea
                              id={field.name}
                              onBlur={field.handleBlur}
                              onChange={(e) => {
                                 field.handleChange(e.target.value);
                                 handleFieldChange("body", e.target.value);
                              }}
                              placeholder="Corpo do e-mail"
                              value={field.state.value}
                           />
                        </Field>
                     )}
                  </form.Field>
               </FieldGroup>
            </>
         )}

         {data.actionType === "stop_execution" && (
            <FieldGroup>
               <form.Field name="reason">
                  {(field) => (
                     <Field>
                        <FieldLabel htmlFor={field.name}>Motivo</FieldLabel>
                        <Input
                           id={field.name}
                           onBlur={field.handleBlur}
                           onChange={(e) => {
                              field.handleChange(e.target.value);
                              handleFieldChange("reason", e.target.value);
                           }}
                           placeholder="Por que parar a execução?"
                           value={field.state.value}
                        />
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         )}

         <div className="flex items-center justify-between rounded-md border p-3">
            <div>
               <FieldLabel className="font-medium">
                  Continuar em caso de erro
               </FieldLabel>
               <p className="text-xs text-muted-foreground">
                  Continuar com as próximas ações se esta falhar
               </p>
            </div>
            <form.Field name="continueOnError">
               {(field) => (
                  <Switch
                     checked={field.state.value}
                     onCheckedChange={(checked) => {
                        field.handleChange(checked);
                        handleFieldChange("continueOnError", checked);
                     }}
                  />
               )}
            </form.Field>
         </div>
      </div>
   );
}
