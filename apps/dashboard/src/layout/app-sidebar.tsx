import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
} from "@packages/ui/components/sidebar";
import {
   Bot,
   CreditCard,
   FileText,
   type LayoutDashboardIcon,
   PiggyBank,
   TrendingUp,
   Wallet,
} from "lucide-react";
import type * as React from "react";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { NavMain } from "./nav-main";
import { OrganizationSwitcher } from "./organization-switcher";

type NavigationItems = {
   url?: keyof FileRoutesByTo;
   title: string;
   icon: typeof LayoutDashboardIcon;
   disabled?: boolean;
   subItems?: {
      url: keyof FileRoutesByTo;
      title: string;
      icon?: typeof LayoutDashboardIcon;
      disabled?: boolean;
   }[];
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   const navMain: NavigationItems[] = [
      {
         icon: CreditCard,
         subItems: [
            {
               icon: TrendingUp,
               title: "Transactions",
               url: "/transactions",
            },
            {
               icon: FileText,
               title: "Categories",
               url: "/categories",
            },
         ],
         title: "Finance",
      },
   ];

   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <OrganizationSwitcher />
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain items={navMain} />
         </SidebarContent>
      </Sidebar>
   );
}
