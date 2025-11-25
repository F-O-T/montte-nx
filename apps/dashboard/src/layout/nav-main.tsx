"use client";

import { translate } from "@packages/localization";
import {
   SidebarGroup,
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
   FileText,
   TrendingUp,
} from "lucide-react";

export function NavMain() {
   const { pathname, searchStr } = useLocation();
   const { setOpenMobile } = useSidebar();
   const isActive = (url: string) => {
      if (!url) return false;

      // Handle query parameter URLs for bills
      if (url.includes("/bills?")) {
         const [path, params] = url.split("?");
         return pathname === path && searchStr === params;
      }

      return pathname === url;
   };

   const items = [
      {
         icon: TrendingUp,
         title: translate("dashboard.layout.nav-main.finance.overview"),
         url: "/$slug/transactions",
      },
      {
         icon: Building2,
         title: translate("dashboard.routes.bank-accounts.list-section.title"),
         url: "/$slug/bank-accounts",
      },
      {
         icon: ArrowDownRight,
         title: translate("dashboard.layout.nav-main.finance.payables"),
         url: "/$slug/bills?type=payable",
      },
      {
         icon: ArrowUpRight,
         title: translate("dashboard.layout.nav-main.finance.receivables"),
         url: "/$slug/bills?type=receivable",
      },
      {
         icon: FileText,
         title: translate("dashboard.layout.nav-main.finance.categories"),
         url: "/$slug/categories",
      },
      {
         icon: BarChart3,
         title: translate("dashboard.layout.nav-main.finance.reports"),
         url: "/$slug/reports",
      },
   ];

   return (
      <SidebarGroup className="group-data-[collapsible=icon]">
         <SidebarGroupLabel>
            {translate("dashboard.layout.nav-main.finance.title")}
         </SidebarGroupLabel>
         <SidebarMenu>
            {items.map((item) => (
               <SidebarMenuItem key={item.title}>
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
      </SidebarGroup>
   );
}
