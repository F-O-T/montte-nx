import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { useSheet } from "@/hooks/use-sheet";
import { InterestTemplateListProvider } from "../features/interest-template-list-context";
import { ManageInterestTemplateForm } from "../features/manage-interest-template-form";
import { InterestTemplatesListSection } from "./interest-templates-list-section";
import { InterestTemplatesStats } from "./interest-templates-stats";

export type InterestTemplate =
   RouterOutput["interestTemplates"]["getAllPaginated"]["templates"][0];

export function InterestTemplatesPage() {
   const { openSheet } = useSheet();

   return (
      <InterestTemplateListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button
                     onClick={() =>
                        openSheet({
                           children: <ManageInterestTemplateForm />,
                        })
                     }
                  >
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
         </main>
      </InterestTemplateListProvider>
   );
}
