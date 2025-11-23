import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
} from "@packages/ui/components/sidebar";
import type * as React from "react";
import { NavMain } from "./nav-main";
import { OrganizationSwitcher } from "./organization-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            <OrganizationSwitcher />
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain />
         </SidebarContent>
      </Sidebar>
   );
}
