import { translate } from "@packages/localization";
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import {
   ArrowDownRight,
   ArrowUpRight,
   BarChart3,
   Building2,
   CirclePlus,
   FileText,
   Landmark,
   Percent,
   Receipt,
   Tag,
   TrendingUp,
   Users,
   Wallet,
} from "lucide-react";
import { ManageTransactionForm } from "@/features/transaction/ui/manage-transaction-form";
import { useSheet } from "@/hooks/use-sheet";

export function NavMain() {
   const { openSheet } = useSheet();
   const { pathname, searchStr } = useLocation();
   const { setOpenMobile, state } = useSidebar();
   const isActive = (url: string) => {
      if (!url) return false;

      const resolvedUrl = url.replace("$slug", pathname.split("/")[1] || "");

      if (resolvedUrl.includes("?")) {
         const [path, params] = resolvedUrl.split("?");
         return pathname === path && searchStr === `?${params}`;
      }

      return pathname === resolvedUrl && !searchStr;
   };

   const financeItems = [
      {
         icon: TrendingUp,
         id: "transactions",
         title: translate("dashboard.layout.nav-main.finance.overview"),
         url: "/$slug/transactions",
      },
      {
         icon: Building2,
         id: "bank-accounts",
         title: translate("dashboard.routes.bank-accounts.list-section.title"),
         url: "/$slug/bank-accounts",
      },
      {
         icon: BarChart3,
         id: "reports",
         title: "Relatórios DRE",
         url: "/$slug/custom-reports",
      },
      {
         icon: Wallet,
         id: "budgets",
         title: translate("dashboard.layout.nav-main.finance.budgets"),
         url: "/$slug/budgets",
      },
   ];

   const billsItems = [
      {
         icon: Receipt,
         id: "bills-overview",
         title: translate("dashboard.layout.nav-main.bills.overview"),
         url: "/$slug/bills",
      },
      {
         icon: ArrowDownRight,
         id: "payables",
         title: translate("dashboard.layout.nav-main.bills.payables"),
         url: "/$slug/bills?type=payable",
      },
      {
         icon: ArrowUpRight,
         id: "receivables",
         title: translate("dashboard.layout.nav-main.bills.receivables"),
         url: "/$slug/bills?type=receivable",
      },
      {
         icon: Users,
         id: "counterparties",
         title: translate("dashboard.layout.nav-main.bills.counterparties"),
         url: "/$slug/counterparties",
      },
      {
         icon: Percent,
         id: "interest-templates",
         title: translate("dashboard.layout.nav-main.bills.interest-templates"),
         url: "/$slug/interest-templates",
      },
   ];

   const categorizationItems = [
      {
         icon: FileText,
         id: "categories",
         title: translate(
            "dashboard.layout.nav-main.categorization.categories",
         ),
         url: "/$slug/categories",
      },
      {
         icon: Landmark,
         id: "cost-centers",
         title: translate(
            "dashboard.layout.nav-main.categorization.cost-centers",
         ),
         url: "/$slug/cost-centers",
      },
      {
         icon: Tag,
         id: "tags",
         title: translate("dashboard.layout.nav-main.categorization.tags"),
         url: "/$slug/tags",
      },
   ];

   return (
      <SidebarGroup className="group-data-[collapsible=icon]">
         <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
               <SidebarMenuButton
                  className="bg-primary text-primary-foreground cursor-pointer"
                  onClick={() =>
                     openSheet({ children: <ManageTransactionForm /> })
                  }
                  tooltip={translate(
                     "dashboard.routes.transactions.features.add-new.title",
                  )}
               >
                  <CirclePlus />
                  <span>
                     {translate(
                        "dashboard.routes.transactions.features.add-new.title",
                     )}
                  </span>
               </SidebarMenuButton>
            </SidebarMenu>
            {state === "expanded" && (
               <SidebarGroupLabel>
                  {translate("dashboard.layout.nav-main.finance.title")}
               </SidebarGroupLabel>
            )}
            <SidebarMenu>
               {financeItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                        asChild
                        className={
                           isActive(item.url)
                              ? "bg-primary/10 text-primary rounded-lg"
                              : ""
                        }
                        tooltip={item.title}
                     >
                        <Link
                           onClick={() => setOpenMobile(false)}
                           params={{}}
                           to={item.url}
                        >
                           <item.icon />
                           <span>{item.title}</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
            </SidebarMenu>
            {state === "expanded" && (
               <SidebarGroupLabel>
                  {translate("dashboard.layout.nav-main.bills.title")}
               </SidebarGroupLabel>
            )}
            <SidebarMenu>
               {billsItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                        asChild
                        className={
                           isActive(item.url)
                              ? "bg-primary/10 text-primary rounded-lg"
                              : ""
                        }
                        tooltip={item.title}
                     >
                        <Link
                           onClick={() => setOpenMobile(false)}
                           params={{}}
                           to={item.url}
                        >
                           <item.icon />
                           <span>{item.title}</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
            </SidebarMenu>
            {state === "expanded" && (
               <SidebarGroupLabel>
                  {translate("dashboard.layout.nav-main.categorization.title")}
               </SidebarGroupLabel>
            )}
            <SidebarMenu>
               {categorizationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                        asChild
                        className={
                           isActive(item.url)
                              ? "bg-primary/10 text-primary rounded-lg"
                              : ""
                        }
                        tooltip={item.title}
                     >
                        <Link
                           onClick={() => setOpenMobile(false)}
                           params={{}}
                           to={item.url}
                        >
                           <item.icon />
                           <span>{item.title}</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}
