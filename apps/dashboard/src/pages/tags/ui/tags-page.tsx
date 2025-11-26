import type { RouterOutput } from "@packages/api/client";
import { TagListProvider } from "../features/tag-list-context";
import { TagsListSection } from "./tags-list-section";
import { TagsQuickActionsToolbar } from "./tags-quick-actions-toolbar";
import { TagsStats } from "./tags-stats";
export type Tag = RouterOutput["tags"]["getAllPaginated"]["tags"][0];

export function TagsPage() {
   return (
      <TagListProvider>
         <main className="grid md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-2 grid gap-4">
               <TagsQuickActionsToolbar />
               <TagsListSection />
            </div>
            <TagsStats />
         </main>
      </TagListProvider>
   );
}
