import { translate } from "@packages/localization";
import {
   Collapsible,
   CollapsibleContent,
   CollapsibleTrigger,
} from "@packages/ui/components/collapsible";
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import {
   ArrowDownRight,
   ArrowUpRight,
   ChevronRight,
   CreditCard,
   FileText,
   TrendingUp,
} from "lucide-react";

export function NavMain() {
   const { pathname } = useLocation();
   const { setOpenMobile } = useSidebar();
   const isActive = (url: string) => {
      if (!url) return false;
      return pathname === url;
   };

   const hasActiveSubItem = (subItems: (typeof items)[0]["items"]) => {
      if (!subItems) return false;
      return subItems.some((subItem) => subItem.url && isActive(subItem.url));
   };

   const items = [
      {
         disabled: false,
         icon: CreditCard,
         items: [
            {
               disabled: false,
               icon: TrendingUp,
               title: translate("dashboard.layout.nav-main.finance.overview"),
               url: "/transactions",
            },
            {
               disabled: false,
               icon: ArrowDownRight,
               title: translate("dashboard.layout.nav-main.finance.payables"),
               url: "/bills/payables",
            },
            {
               disabled: false,
               icon: ArrowUpRight,
               title: translate(
                  "dashboard.layout.nav-main.finance.receivables",
               ),
               url: "/bills/receivables",
            },
            {
               disabled: false,
               icon: FileText,
               title: translate("dashboard.layout.nav-main.finance.categories"),
               url: "/categories",
            },
         ],
         title: translate("dashboard.layout.nav-main.finance.label"),
      },
   ];

   return (
      <SidebarGroup>
         <SidebarGroupLabel>
            {translate("dashboard.layout.nav-main.finance.title")}
         </SidebarGroupLabel>
         <SidebarMenu>
            {items.map((item) => (
               <Collapsible
                  asChild
                  className="group/collapsible"
                  defaultOpen={hasActiveSubItem(item.items)}
                  key={item.title}
               >
                  <SidebarMenuItem>
                     <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                           className={`${hasActiveSubItem(item.items) ? "bg-primary/10 text-primary rounded-lg" : ""} ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                           tooltip={item.title}
                        >
                           {item.icon && <item.icon />}
                           <span>{item.title}</span>
                           <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                        <SidebarMenuSub>
                           {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                 <SidebarMenuSubButton
                                    asChild
                                    className={`${isActive(subItem.url) ? "bg-primary/10 text-primary rounded-lg" : ""} ${subItem.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                                 >
                                    {subItem.disabled ? (
                                       <div className="flex items-center gap-2">
                                          {subItem.icon && <subItem.icon />}
                                          <span>{subItem.title}</span>
                                       </div>
                                    ) : (
                                       <Link
                                          className="flex items-center gap-2"
                                          onClick={() => setOpenMobile(false)}
                                          to={subItem.url}
                                       >
                                          {subItem.icon && <subItem.icon />}
                                          <span>{subItem.title}</span>
                                       </Link>
                                    )}
                                 </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                           ))}
                        </SidebarMenuSub>
                     </CollapsibleContent>
                  </SidebarMenuItem>
               </Collapsible>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
