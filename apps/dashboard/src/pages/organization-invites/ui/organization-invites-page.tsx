import { InvitesListSection } from "./organization-invites-list-section";
import { InvitesQuickActionsToolbar } from "./organization-invites-quick-actions-toolbar";
import { InvitesStats } from "./organization-invites-stats";

export function OrganizationInvitesPage() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 grid gap-4">
               <InvitesQuickActionsToolbar />
               <InvitesListSection />
            </div>
            <InvitesStats />
         </div>
      </main>
   );
}
