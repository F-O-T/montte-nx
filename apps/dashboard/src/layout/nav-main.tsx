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
   TrendingUp,
   ArrowDownRight,
   ArrowUpRight,
   FileText,
   BarChart3,
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
         title: translate("dashboard.layout.nav-main.finance.overview"),
         url: "/transactions",
         icon: TrendingUp,
      },
      {
         title: translate("dashboard.layout.nav-main.finance.payables"),
         url: "/bills?type=payable",
         icon: ArrowDownRight,
      },
      {
         title: translate("dashboard.layout.nav-main.finance.receivables"),
         url: "/bills?type=receivable",
         icon: ArrowUpRight,
      },
      {
         title: translate("dashboard.layout.nav-main.finance.categories"),
         url: "/categories",
         icon: FileText,
      },
      {
         title: translate("dashboard.layout.nav-main.finance.reports"),
         url: "/reports",
         icon: BarChart3,
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
                     <Link to={item.url} onClick={() => setOpenMobile(false)}>
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
