import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Landmark, Tag, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";
import type { Transaction } from "../ui/transaction-item";

const CATEGORY_COLORS = [
   "#ef4444",
   "#f97316",
   "#f59e0b",
   "#eab308",
   "#84cc16",
   "#22c55e",
   "#10b981",
   "#14b8a6",
   "#06b6d4",
   "#0ea5e9",
   "#3b82f6",
   "#6366f1",
   "#8b5cf6",
   "#a855f7",
   "#d946ef",
   "#ec4899",
   "#f43f5e",
];

function getRandomColor(): string {
   const index = Math.floor(Math.random() * CATEGORY_COLORS.length);
   return CATEGORY_COLORS[index] ?? "#3b82f6";
}

type CategorizeSheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   transactions: Transaction[];
   onSuccess?: () => void;
   defaultTab?: "category" | "cost-center" | "tags";
};

export function CategorizeSheet({
   isOpen,
   onOpenChange,
   transactions,
   onSuccess,
   defaultTab = "category",
}: CategorizeSheetProps) {
   const queryClient = useQueryClient();
   const [activeTab, setActiveTab] = useState(defaultTab);
   const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
   const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>("");
   const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

   const { data: categories = [] } = useQuery(
      trpc.categories.getAll.queryOptions(),
   );

   const { data: costCenters = [] } = useQuery(
      trpc.costCenters.getAll.queryOptions(),
   );

   const { data: tags = [] } = useQuery(trpc.tags.getAll.queryOptions());

   const invalidateQueries = async () => {
      await Promise.all([
         queryClient.invalidateQueries({
            queryKey: trpc.transactions.getAllPaginated.queryKey(),
         }),
         queryClient.invalidateQueries({
            queryKey: trpc.bankAccounts.getTransactions.queryKey(),
         }),
         queryClient.invalidateQueries({
            queryKey: trpc.transactions.getStats.queryKey(),
         }),
      ]);
   };

   const updateCategoryMutation = useMutation(
      trpc.transactions.updateCategory.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao atualizar categoria");
         },
         onSuccess: async (data) => {
            await invalidateQueries();
            toast.success(
               `Categoria atualizada para ${data.length} ${data.length === 1 ? "transação" : "transações"}`,
            );
            onSuccess?.();
            handleOpenChange(false);
         },
      }),
   );

   const updateCostCenterMutation = useMutation(
      trpc.transactions.updateCostCenter.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao atualizar centro de custo");
         },
         onSuccess: async (data) => {
            await invalidateQueries();
            toast.success(
               `Centro de custo atualizado para ${data.length} ${data.length === 1 ? "transação" : "transações"}`,
            );
            onSuccess?.();
            handleOpenChange(false);
         },
      }),
   );

   const updateTagsMutation = useMutation(
      trpc.transactions.updateTags.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao atualizar tags");
         },
         onSuccess: async (data) => {
            await invalidateQueries();
            toast.success(
               `Tags atualizadas para ${data.length} ${data.length === 1 ? "transação" : "transações"}`,
            );
            onSuccess?.();
            handleOpenChange(false);
         },
      }),
   );

   const createCategoryMutation = useMutation(
      trpc.categories.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao criar categoria");
         },
         onSuccess: async (data) => {
            if (!data) return;
            await queryClient.invalidateQueries({
               queryKey: trpc.categories.getAll.queryKey(),
            });
            setSelectedCategoryId(data.id);
            toast.success(`Categoria "${data.name}" criada`);
         },
      }),
   );

   const createCostCenterMutation = useMutation(
      trpc.costCenters.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao criar centro de custo");
         },
         onSuccess: async (data) => {
            if (!data) return;
            await queryClient.invalidateQueries({
               queryKey: trpc.costCenters.getAll.queryKey(),
            });
            setSelectedCostCenterId(data.id);
            toast.success(`Centro de custo "${data.name}" criado`);
         },
      }),
   );

   const createTagMutation = useMutation(
      trpc.tags.create.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao criar tag");
         },
         onSuccess: async (data) => {
            if (!data) return;
            await queryClient.invalidateQueries({
               queryKey: trpc.tags.getAll.queryKey(),
            });
            setSelectedTagIds((prev) => [...prev, data.id]);
            toast.success(`Tag "${data.name}" criada`);
         },
      }),
   );

   const isLoading =
      updateCategoryMutation.isPending ||
      updateCostCenterMutation.isPending ||
      updateTagsMutation.isPending;

   const isCreating =
      createCategoryMutation.isPending ||
      createCostCenterMutation.isPending ||
      createTagMutation.isPending;

   const handleCreateCategory = (name: string) => {
      createCategoryMutation.mutate({
         color: getRandomColor(),
         name,
      });
   };

   const handleCreateCostCenter = (name: string) => {
      createCostCenterMutation.mutate({
         name,
      });
   };

   const handleCreateTag = (name: string) => {
      createTagMutation.mutate({
         color: getRandomColor(),
         name,
      });
   };

   const handleConfirmCategory = () => {
      if (selectedCategoryId && transactions.length > 0) {
         updateCategoryMutation.mutate({
            categoryId: selectedCategoryId,
            ids: transactions.map((t) => t.id),
         });
      }
   };

   const handleConfirmCostCenter = () => {
      if (transactions.length > 0) {
         updateCostCenterMutation.mutate({
            costCenterId: selectedCostCenterId || null,
            ids: transactions.map((t) => t.id),
         });
      }
   };

   const handleConfirmTags = () => {
      if (transactions.length > 0) {
         updateTagsMutation.mutate({
            ids: transactions.map((t) => t.id),
            tagIds: selectedTagIds,
         });
      }
   };

   const handleOpenChange = (open: boolean) => {
      if (!open) {
         setSelectedCategoryId("");
         setSelectedCostCenterId("");
         setSelectedTagIds([]);
         setActiveTab(defaultTab);
      }
      onOpenChange(open);
   };

   const categoryOptions = categories.map((category) => ({
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

   const tagOptions = tags
      .filter((tag) => !selectedTagIds.includes(tag.id))
      .map((tag) => ({
         label: tag.name,
         value: tag.id,
      }));

   const handleAddTag = (tagId: string) => {
      if (tagId && !selectedTagIds.includes(tagId)) {
         setSelectedTagIds((prev) => [...prev, tagId]);
      }
   };

   const handleRemoveTag = (tagId: string) => {
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
   };

   const transactionCount = transactions.length;
   const transactionLabel =
      transactionCount === 1 ? "1 transação" : `${transactionCount} transações`;

   return (
      <Sheet onOpenChange={handleOpenChange} open={isOpen}>
         <SheetContent side="right">
            <SheetHeader>
               <SheetTitle>Categorizar Transações</SheetTitle>
               <SheetDescription>
                  Associe categoria, centro de custo ou tags para{" "}
                  {transactionLabel}.
               </SheetDescription>
            </SheetHeader>
            <div className="px-4 py-4">
               <Tabs
                  onValueChange={(value) =>
                     setActiveTab(value as typeof activeTab)
                  }
                  value={activeTab}
               >
                  <TabsList className="grid w-full grid-cols-3">
                     <TabsTrigger className="gap-1.5" value="category">
                        <FolderOpen className="size-3.5" />
                        <span className="hidden sm:inline">Categoria</span>
                     </TabsTrigger>
                     <TabsTrigger className="gap-1.5" value="cost-center">
                        <Landmark className="size-3.5" />
                        <span className="hidden sm:inline">Centro</span>
                     </TabsTrigger>
                     <TabsTrigger className="gap-1.5" value="tags">
                        <Tag className="size-3.5" />
                        <span className="hidden sm:inline">Tags</span>
                     </TabsTrigger>
                  </TabsList>

                  <TabsContent className="mt-4 space-y-4" value="category">
                     <FieldGroup>
                        <Field>
                           <FieldLabel>
                              {translate("common.form.category.label")}
                           </FieldLabel>
                           <Combobox
                              createLabel="Criar categoria"
                              disabled={isCreating}
                              emptyMessage={translate(
                                 "common.form.search.no-results",
                              )}
                              onCreate={handleCreateCategory}
                              onValueChange={setSelectedCategoryId}
                              options={categoryOptions}
                              placeholder={translate(
                                 "common.form.category.placeholder",
                              )}
                              searchPlaceholder={translate(
                                 "common.form.search.label",
                              )}
                              value={selectedCategoryId}
                           />
                        </Field>
                     </FieldGroup>
                     <Button
                        className="w-full"
                        disabled={
                           !selectedCategoryId || isLoading || isCreating
                        }
                        onClick={handleConfirmCategory}
                     >
                        {isLoading ? "Salvando..." : "Aplicar Categoria"}
                     </Button>
                  </TabsContent>

                  <TabsContent className="mt-4 space-y-4" value="cost-center">
                     <FieldGroup>
                        <Field>
                           <FieldLabel>
                              {translate("common.form.cost-center.label")}
                           </FieldLabel>
                           <Combobox
                              createLabel="Criar centro de custo"
                              disabled={isCreating}
                              emptyMessage={translate(
                                 "common.form.search.no-results",
                              )}
                              onCreate={handleCreateCostCenter}
                              onValueChange={setSelectedCostCenterId}
                              options={costCenterOptions}
                              placeholder={translate(
                                 "common.form.cost-center.placeholder",
                              )}
                              searchPlaceholder={translate(
                                 "common.form.search.label",
                              )}
                              value={selectedCostCenterId}
                           />
                        </Field>
                     </FieldGroup>
                     <Button
                        className="w-full"
                        disabled={isLoading || isCreating}
                        onClick={handleConfirmCostCenter}
                     >
                        {isLoading ? "Salvando..." : "Aplicar Centro de Custo"}
                     </Button>
                  </TabsContent>

                  <TabsContent className="mt-4 space-y-4" value="tags">
                     <FieldGroup>
                        <Field>
                           <FieldLabel>
                              {translate("common.form.tags.label")}
                           </FieldLabel>
                           {selectedTagIds.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                 {selectedTagIds.map((tagId) => {
                                    const tag = tags.find(
                                       (t) => t.id === tagId,
                                    );
                                    if (!tag) return null;
                                    return (
                                       <Badge
                                          key={tag.id}
                                          style={{ backgroundColor: tag.color }}
                                          variant="secondary"
                                       >
                                          {tag.name}
                                          <button
                                             className="ml-1 rounded-full hover:bg-black/20"
                                             onClick={() =>
                                                handleRemoveTag(tag.id)
                                             }
                                             type="button"
                                          >
                                             <X className="size-3" />
                                          </button>
                                       </Badge>
                                    );
                                 })}
                              </div>
                           )}
                           <Combobox
                              createLabel="Criar tag"
                              disabled={isCreating}
                              emptyMessage={translate(
                                 "common.form.search.no-results",
                              )}
                              onCreate={handleCreateTag}
                              onValueChange={handleAddTag}
                              options={tagOptions}
                              placeholder={translate(
                                 "common.form.tags.placeholder",
                              )}
                              searchPlaceholder={translate(
                                 "common.form.search.label",
                              )}
                              value=""
                           />
                        </Field>
                     </FieldGroup>
                     <Button
                        className="w-full"
                        disabled={isLoading || isCreating}
                        onClick={handleConfirmTags}
                     >
                        {isLoading ? "Salvando..." : "Aplicar Tags"}
                     </Button>
                  </TabsContent>
               </Tabs>
            </div>
         </SheetContent>
      </Sheet>
   );
}
