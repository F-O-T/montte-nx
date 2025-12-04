import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { ManageTagSheet } from "../features/manage-tag-sheet";
import { TagListProvider } from "../features/tag-list-context";
import { TagsListSection } from "./tags-list-section";
import { TagsStats } from "./tags-stats";

export type Tag = RouterOutput["tags"]["getAllPaginated"]["tags"][0];

export function TagsPage() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   return (
      <TagListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button onClick={() => setIsCreateSheetOpen(true)}>
                     <Plus className="size-4" />
                     {translate(
                        "dashboard.routes.tags.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               }
               description={translate(
                  "dashboard.routes.tags.list-section.description",
               )}
               title={translate("dashboard.routes.tags.list-section.title")}
            />
            <TagsStats />
            <TagsListSection />
            <ManageTagSheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </main>
      </TagListProvider>
   );
}
