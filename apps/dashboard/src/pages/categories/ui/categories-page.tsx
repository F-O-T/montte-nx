import { CategoriesTable } from "./categories-table";

export function CategoriesPage() {
   return (
      <main className="grid md:grid-cols-3 h-full w-full gap-4">
         <div className="md:col-span-3">
            <CategoriesTable />
         </div>
      </main>
   );
}
