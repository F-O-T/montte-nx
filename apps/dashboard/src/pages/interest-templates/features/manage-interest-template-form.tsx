import type { InterestTemplate } from "@packages/database/repositories/interest-template-repository";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Field,
   FieldDescription,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
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
import { defineStepper } from "@packages/ui/components/stepper";
import { Switch } from "@packages/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useMemo } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type ManageInterestTemplateFormProps = {
   template?: InterestTemplate;
};

type StepId = "basic-info" | "interest-penalty" | "advanced";

const allSteps: Array<{ id: StepId; title: string }> = [
   { id: "basic-info", title: "basic-info" },
   { id: "interest-penalty", title: "interest-penalty" },
   { id: "advanced", title: "advanced" },
];

const { Stepper, useStepper } = defineStepper(...allSteps);

export function ManageInterestTemplateForm({
   template,
}: ManageInterestTemplateFormProps) {
   const trpc = useTRPC();
   const { closeSheet } = useSheet();
   const isEditMode = !!template;

   const modeTexts = useMemo(() => {
      const createTexts = {
         description: translate(
            "dashboard.routes.interest-templates.features.create-template.description",
         ),
         title: translate(
            "dashboard.routes.interest-templates.features.create-template.title",
         ),
      };

      const editTexts = {
         description: translate(
            "dashboard.routes.interest-templates.features.edit-template.description",
            { name: template?.name || "" },
         ),
         title: translate(
            "dashboard.routes.interest-templates.features.edit-template.title",
         ),
      };

      return isEditMode ? editTexts : createTexts;
   }, [isEditMode, template?.name]);

   const createTemplateMutation = useMutation(
      trpc.interestTemplates.create.mutationOptions({
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const updateTemplateMutation = useMutation(
      trpc.interestTemplates.update.mutationOptions({
         onError: (error) => {
            console.error("Failed to update interest template:", error);
         },
         onSuccess: () => {
            closeSheet();
         },
      }),
   );

   const form = useForm({
      defaultValues: {
         gracePeriodDays: template?.gracePeriodDays ?? 0,
         interestType: (template?.interestType || "none") as
            | "none"
            | "daily"
            | "monthly",
         interestValue: template?.interestValue || "",
         isDefault: template?.isDefault ?? false,
         monetaryCorrectionIndex: (template?.monetaryCorrectionIndex ||
            "none") as "none" | "ipca" | "selic" | "cdi",
         name: template?.name || "",
         penaltyType: (template?.penaltyType || "none") as
            | "none"
            | "percentage"
            | "fixed",
         penaltyValue: template?.penaltyValue || "",
      },
      onSubmit: async ({ value }) => {
         if (!value.name) {
            return;
         }

         try {
            if (isEditMode && template) {
               await updateTemplateMutation.mutateAsync({
                  data: {
                     gracePeriodDays: value.gracePeriodDays,
                     interestType: value.interestType,
                     interestValue: value.interestValue || undefined,
                     isDefault: value.isDefault,
                     monetaryCorrectionIndex: value.monetaryCorrectionIndex,
                     name: value.name,
                     penaltyType: value.penaltyType,
                     penaltyValue: value.penaltyValue || undefined,
                  },
                  id: template.id,
               });
            } else {
               await createTemplateMutation.mutateAsync({
                  gracePeriodDays: value.gracePeriodDays,
                  interestType: value.interestType,
                  interestValue: value.interestValue || undefined,
                  isDefault: value.isDefault,
                  monetaryCorrectionIndex: value.monetaryCorrectionIndex,
                  name: value.name,
                  penaltyType: value.penaltyType,
                  penaltyValue: value.penaltyValue || undefined,
               });
            }
         } catch (error) {
            console.error(
               `Failed to ${isEditMode ? "update" : "create"} interest template:`,
               error,
            );
         }
      },
   });

   const isPending =
      createTemplateMutation.isPending || updateTemplateMutation.isPending;

   function StepperControls() {
      const { isFirst, isLast, prev, next } = useStepper();

      return (
         <Stepper.Controls className="w-full flex-col gap-2">
            {isLast ? (
               <form.Subscribe selector={(state) => state}>
                  {(state) => (
                     <Button
                        className="w-full"
                        disabled={
                           !state.canSubmit || state.isSubmitting || isPending
                        }
                        type="submit"
                     >
                        <Check className="size-4 mr-2" />
                        {modeTexts.title}
                     </Button>
                  )}
               </form.Subscribe>
            ) : (
               <Button 
                  className="w-full" 
                  onClick={async (e) => {
                     e.preventDefault();
                     e.stopPropagation();

                     await form.validateAllFields("blur");

                     if (form.state.canSubmit) {
                        next();
                     }
                  }}
                  type="button"
               >
                  {translate("common.actions.next")}
                  <ArrowRight className="size-4 ml-2" />
               </Button>
            )}
            {!isFirst && (
               <Button
                  className="w-full"
                  onClick={prev}
                  type="button"
                  variant="outline"
               >
                  <ArrowLeft className="size-4 mr-2" />
                  {translate("common.actions.previous")}
               </Button>
            )}
         </Stepper.Controls>
      );
   }

   function BasicInfoStep() {
      return (
         <div className="grid gap-4 py-4">
            <div className="space-y-2">
               <h3 className="font-medium text-base">
                  {translate(
                     "dashboard.routes.interest-templates.features.stepper.steps.basic-info.title",
                  )}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {translate(
                     "dashboard.routes.interest-templates.features.stepper.steps.basic-info.description",
                  )}
               </p>
            </div>

            <FieldGroup>
               <form.Field 
                  name="name"
                  validators={{
                     onBlur: z.string().min(1, translate("common.validation.required")),
                  }}
               >
                  {(field) => {
                     const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid;
                     return (
                        <Field data-invalid={isInvalid}>
                           <FieldLabel>
                              {translate(
                                 "dashboard.routes.interest-templates.form.name.label",
                              )}
                           </FieldLabel>
                           <Input
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                 field.handleChange(e.target.value)
                              }
                              placeholder={translate(
                                 "dashboard.routes.interest-templates.form.name.placeholder",
                              )}
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
               <form.Field name="isDefault">
                  {(field) => (
                     <Field>
                        <div className="flex items-center justify-between">
                           <div className="space-y-0.5">
                              <FieldLabel className="mb-0">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.is-default.label",
                                 )}
                              </FieldLabel>
                              <FieldDescription>
                                 {translate(
                                    "dashboard.routes.interest-templates.form.is-default.description",
                                 )}
                              </FieldDescription>
                           </div>
                           <Switch
                              checked={field.state.value}
                              onCheckedChange={field.handleChange}
                           />
                        </div>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         </div>
      );
   }

   function InterestPenaltyStep() {
      return (
         <div className="grid gap-4 py-4">
            <div className="space-y-2">
               <h3 className="font-medium text-base">
                  {translate(
                     "dashboard.routes.interest-templates.features.stepper.steps.interest-penalty.title",
                  )}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {translate(
                     "dashboard.routes.interest-templates.features.stepper.steps.interest-penalty.description",
                  )}
               </p>
            </div>

            {/* Penalty Section */}
            <FieldGroup>
               <form.Field name="penaltyType">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.interest-templates.form.penalty-type.label",
                           )}
                        </FieldLabel>
                        <Select
                           onValueChange={(value) =>
                              field.handleChange(
                                 value as "none" | "percentage" | "fixed",
                              )
                           }
                           value={field.state.value}
                        >
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.penalty-type.none",
                                 )}
                              </SelectItem>
                              <SelectItem value="percentage">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.penalty-type.percentage",
                                 )}
                              </SelectItem>
                              <SelectItem value="fixed">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.penalty-type.fixed",
                                 )}
                              </SelectItem>
                           </SelectContent>
                        </Select>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>

            <form.Subscribe selector={(state) => state.values.penaltyType}>
               {(penaltyType) =>
                  penaltyType !== "none" && (
                     <FieldGroup>
                        <form.Field name="penaltyValue">
                           {(field) => (
                              <Field>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.interest-templates.form.penalty-value.label",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder={
                                       penaltyType === "percentage"
                                          ? "2.00"
                                          : "100.00"
                                    }
                                    type="number"
                                    value={field.state.value}
                                 />
                              </Field>
                           )}
                        </form.Field>
                     </FieldGroup>
                  )
               }
            </form.Subscribe>

            {/* Interest Section */}
            <FieldGroup>
               <form.Field name="interestType">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.interest-templates.form.interest-type.label",
                           )}
                        </FieldLabel>
                        <Select
                           onValueChange={(value) =>
                              field.handleChange(
                                 value as "none" | "daily" | "monthly",
                              )
                           }
                           value={field.state.value}
                        >
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.interest-type.none",
                                 )}
                              </SelectItem>
                              <SelectItem value="daily">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.interest-type.daily",
                                 )}
                              </SelectItem>
                              <SelectItem value="monthly">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.interest-type.monthly",
                                 )}
                              </SelectItem>
                           </SelectContent>
                        </Select>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>

            <form.Subscribe selector={(state) => state.values.interestType}>
               {(interestType) =>
                  interestType !== "none" && (
                     <FieldGroup>
                        <form.Field name="interestValue">
                           {(field) => (
                              <Field>
                                 <FieldLabel>
                                    {translate(
                                       "dashboard.routes.interest-templates.form.interest-value.label",
                                    )}
                                 </FieldLabel>
                                 <Input
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                       field.handleChange(e.target.value)
                                    }
                                    placeholder="1.00"
                                    type="number"
                                    value={field.state.value}
                                 />
                              </Field>
                           )}
                        </form.Field>
                     </FieldGroup>
                  )
               }
            </form.Subscribe>
         </div>
      );
   }

   function AdvancedStep() {
      return (
         <div className="grid gap-4 py-4">
            <div className="space-y-2">
               <h3 className="font-medium text-base">
                  {translate(
                     "dashboard.routes.interest-templates.features.stepper.steps.advanced.title",
                  )}
               </h3>
               <p className="text-sm text-muted-foreground">
                  {translate(
                     "dashboard.routes.interest-templates.features.stepper.steps.advanced.description",
                  )}
               </p>
            </div>

            <FieldGroup>
               <form.Field name="monetaryCorrectionIndex">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.interest-templates.form.monetary-correction.label",
                           )}
                        </FieldLabel>
                        <Select
                           onValueChange={(value) =>
                              field.handleChange(
                                 value as "none" | "ipca" | "selic" | "cdi",
                              )
                           }
                           value={field.state.value}
                        >
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="none">
                                 {translate(
                                    "dashboard.routes.interest-templates.form.monetary-correction.none",
                                 )}
                              </SelectItem>
                              <SelectItem value="ipca">IPCA</SelectItem>
                              <SelectItem value="selic">SELIC</SelectItem>
                              <SelectItem value="cdi">CDI</SelectItem>
                           </SelectContent>
                        </Select>
                        <FieldDescription>
                           {translate(
                              "dashboard.routes.interest-templates.form.monetary-correction.description",
                           )}
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>

            <FieldGroup>
               <form.Field name="gracePeriodDays">
                  {(field) => (
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.interest-templates.form.grace-period.label",
                           )}
                        </FieldLabel>
                        <Input
                           min={0}
                           onBlur={field.handleBlur}
                           onChange={(e) =>
                              field.handleChange(Number(e.target.value))
                           }
                           placeholder="0"
                           type="number"
                           value={field.state.value}
                        />
                        <FieldDescription>
                           {translate(
                              "dashboard.routes.interest-templates.form.grace-period.description",
                           )}
                        </FieldDescription>
                     </Field>
                  )}
               </form.Field>
            </FieldGroup>
         </div>
      );
   }

   return (
      <Stepper.Provider
         className="h-full"
         initialStep="basic-info"
         variant="line"
      >
         {({ methods }) => (
            <form
               className="h-full flex flex-col"
               onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
               }}
            >
               <SheetHeader>
                  <SheetTitle>{modeTexts.title}</SheetTitle>
                  <SheetDescription>{modeTexts.description}</SheetDescription>
               </SheetHeader>

               <div className="px-4 py-2">
                  <Stepper.Navigation>
                     {allSteps.map((step) => (
                        <Stepper.Step key={step.id} of={step.id} />
                     ))}
                  </Stepper.Navigation>
               </div>

               <div className="px-4 flex-1 overflow-y-auto">
                  {methods.switch({
                     "basic-info": () => <BasicInfoStep />,
                     "interest-penalty": () => <InterestPenaltyStep />,
                     advanced: () => <AdvancedStep />,
                  })}
               </div>

               <SheetFooter className="flex-col gap-2 px-4">
                  <StepperControls />
               </SheetFooter>
            </form>
         )}
      </Stepper.Provider>
   );
}
