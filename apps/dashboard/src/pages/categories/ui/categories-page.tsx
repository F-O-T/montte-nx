import type { RouterOutput } from "@packages/api/client";
import { CategoriesListSection } from "./categories-list-section";
import { CategoriesQuickActionsToolbar } from "./categories-quick-actions-toolbar";
import { CategoriesStats } from "./categories-stats";
export type Category =
   RouterOutput["categories"]["getAllPaginated"]["categories"][0];
export function CategoriesPage() {
   return (
      <main className="grid md:grid-cols-3 gap-4">
         <div className="col-span-1 md:col-span-2 grid gap-4">
            <CategoriesQuickActionsToolbar />
            <CategoriesListSection />
         </div>
         <CategoriesStats />
      </main>
   );
}
