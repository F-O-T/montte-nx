import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { CategoryListProvider } from "../features/category-list-context";
import { ManageCategorySheet } from "../features/manage-category-sheet";
import { CategoriesCharts } from "./categories-charts";
import { CategoriesListSection } from "./categories-list-section";
import { CategoriesStats } from "./categories-stats";

export type Category =
   RouterOutput["categories"]["getAllPaginated"]["categories"][0];

export function CategoriesPage() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   return (
      <CategoryListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button onClick={() => setIsCreateSheetOpen(true)}>
                     <Plus className="size-4" />
                     {translate(
                        "dashboard.routes.categories.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               }
               description={translate(
                  "dashboard.routes.categories.list-section.description",
               )}
               title={translate(
                  "dashboard.routes.categories.list-section.title",
               )}
            />
            <CategoriesStats />
            <CategoriesListSection />
            <CategoriesCharts />
            <ManageCategorySheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </main>
      </CategoryListProvider>
   );
}
