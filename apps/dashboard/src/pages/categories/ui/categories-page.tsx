import type { RouterOutput } from "@packages/api/client";
import { DefaultHeader } from "@/default/default-header";
import { CategoryListProvider } from "../features/category-list-context";
import { CategoriesListSection } from "./categories-list-section";
import { CategoriesStats } from "./categories-stats";
export type Category =
   RouterOutput["categories"]["getAllPaginated"]["categories"][0];

export function CategoriesPage() {
   return (
      <CategoryListProvider>
         <main className="space-y-4">
            <DefaultHeader
               description="Gerencie suas categorias de transacoes"
               title="Categorias"
            />
            <CategoriesStats />
            <CategoriesListSection />
         </main>
      </CategoryListProvider>
   );
}
