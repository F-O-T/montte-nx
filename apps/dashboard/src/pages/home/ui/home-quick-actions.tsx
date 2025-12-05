import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useRouter } from "@tanstack/react-router";
import {
   ArrowDownRight,
   ArrowUpRight,
   BarChart3,
   CirclePlus,
} from "lucide-react";
import { ManageTransactionForm } from "@/features/transaction/ui/manage-transaction-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";

export function HomeQuickActions() {
   const { openSheet } = useSheet();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const quickActions = [
      {
         description: translate(
            "dashboard.routes.home.quick-actions.new-transaction.description",
         ),
         icon: <CirclePlus className="size-6" />,
         onClick: () => openSheet({ children: <ManageTransactionForm /> }),
         title: translate(
            "dashboard.routes.home.quick-actions.new-transaction.title",
         ),
      },
      {
         description: translate(
            "dashboard.routes.home.quick-actions.reports.description",
         ),
         icon: <BarChart3 className="size-6" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/reports",
            }),
         title: translate("dashboard.routes.home.quick-actions.reports.title"),
      },
      {
         description: translate(
            "dashboard.routes.home.quick-actions.payables.description",
         ),
         icon: <ArrowDownRight className="size-6" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               search: { type: "payable" },
               to: "/$slug/bills",
            }),
         title: translate("dashboard.routes.home.quick-actions.payables.title"),
      },
      {
         description: translate(
            "dashboard.routes.home.quick-actions.receivables.description",
         ),
         icon: <ArrowUpRight className="size-6" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               search: { type: "receivable" },
               to: "/$slug/bills",
            }),
         title: translate(
            "dashboard.routes.home.quick-actions.receivables.title",
         ),
      },
   ];

   return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
         {quickActions.map((action, index) => (
            <QuickAccessCard
               description={action.description}
               icon={action.icon}
               key={`quick-action-${index + 1}`}
               onClick={action.onClick}
               title={action.title}
            />
         ))}
      </div>
   );
}
