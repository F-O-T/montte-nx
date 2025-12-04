import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { InterestTemplateListProvider } from "../features/interest-template-list-context";
import { ManageInterestTemplateSheet } from "../features/manage-interest-template-sheet";
import { InterestTemplatesListSection } from "./interest-templates-list-section";
import { InterestTemplatesStats } from "./interest-templates-stats";

export type InterestTemplate =
   RouterOutput["interestTemplates"]["getAllPaginated"]["templates"][0];

export function InterestTemplatesPage() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   return (
      <InterestTemplateListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button onClick={() => setIsCreateSheetOpen(true)}>
                     <Plus className="size-4" />
                     {translate(
                        "dashboard.routes.interest-templates.actions.add-new",
                     )}
                  </Button>
               }
               description={translate(
                  "dashboard.routes.interest-templates.description",
               )}
               title={translate("dashboard.routes.interest-templates.title")}
            />
            <InterestTemplatesStats />
            <InterestTemplatesListSection />
            <ManageInterestTemplateSheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </main>
      </InterestTemplateListProvider>
   );
}
