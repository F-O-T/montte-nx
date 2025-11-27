import type { RouterOutput } from "@packages/api/client";
import { DefaultHeader } from "@/default/default-header";
import { TagListProvider } from "../features/tag-list-context";
import { TagsListSection } from "./tags-list-section";
import { TagsStats } from "./tags-stats";

export type Tag = RouterOutput["tags"]["getAllPaginated"]["tags"][0];

export function TagsPage() {
   return (
      <TagListProvider>
         <main className="space-y-4">
            <DefaultHeader
               description="Gerencie suas tags de transacoes"
               title="Tags"
            />
            <TagsStats />
            <TagsListSection />
         </main>
      </TagListProvider>
   );
}
