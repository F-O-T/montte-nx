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
   Tag,
   TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";

export function NavMain() {
   const [isTransactionSheetOpen, setIsTransactionSheetOpen] = useState(false);
   const { pathname, searchStr } = useLocation();
   const { setOpenMobile, state } = useSidebar();
   const isActive = (url: string) => {
      if (!url) return false;

      // Handle query parameter URLs for bills
      if (url.includes("/bills?")) {
         const [path, params] = url.split("?");
         return pathname === path && searchStr === params;
      }

      return pathname === url;
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
         icon: ArrowDownRight,
         id: "payables",
         title: translate("dashboard.layout.nav-main.finance.payables"),
         url: "/$slug/bills?type=payable",
      },
      {
         icon: ArrowUpRight,
         id: "receivables",
         title: translate("dashboard.layout.nav-main.finance.receivables"),
         url: "/$slug/bills?type=receivable",
      },
      {
         icon: BarChart3,
         id: "reports",
         title: translate("dashboard.layout.nav-main.finance.reports"),
         url: "/$slug/reports",
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
                  onClick={() => setIsTransactionSheetOpen(true)}
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
         <ManageTransactionSheet
            onOpen={isTransactionSheetOpen}
            onOpenChange={setIsTransactionSheetOpen}
         />
      </SidebarGroup>
   );
}
