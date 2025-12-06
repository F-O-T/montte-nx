import type { SupportedLng } from "@packages/localization";
import {
   NavigationMenu,
   NavigationMenuContent,
   NavigationMenuItem,
   NavigationMenuLink,
   NavigationMenuList,
   NavigationMenuTrigger,
   navigationMenuTriggerStyle,
} from "@packages/ui/components/navigation-menu";
import { cn } from "@packages/ui/lib/utils";
import { Receipt, Wallet, Workflow } from "lucide-react";
import type { ComponentProps } from "react";
import { menuItems, productItems } from "../data/menu-items";

interface NavMenuProps extends ComponentProps<"nav"> {
   orientation?: "horizontal" | "vertical";
   lang?: SupportedLng;
}

const productIcons = {
   "#bank-accounts": Wallet,
   "#financial-workflow": Workflow,
   "#transactions": Receipt,
};

export const NavMenu = ({
   orientation = "horizontal",
   lang: _lang = "pt-BR",
}: NavMenuProps) => {
   return (
      <NavigationMenu
         className={orientation === "vertical" ? "flex-col items-start" : ""}
      >
         <NavigationMenuList
            className={cn(
               orientation === "vertical"
                  ? "flex-col items-start justify-start space-x-0 space-y-2"
                  : "gap-2",
            )}
         >
            <NavigationMenuItem>
               <NavigationMenuTrigger className="bg-transparent">
                  Produto
               </NavigationMenuTrigger>
               <NavigationMenuContent className="grid gap-3 p-4">
                  <div className="grid gap-2 p-2 grid-cols-1 w-72">
                     {productItems.map((item) => {
                        const Icon =
                           productIcons[item.href as keyof typeof productIcons];
                        return (
                           <NavigationMenuLink asChild key={item.href}>
                              <a
                                 className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                 href={item.href}
                              >
                                 <div className="flex items-center gap-2">
                                    {Icon && <Icon className="size-4" />}
                                    <div className="text-sm font-medium leading-none">
                                       {item.name}
                                    </div>
                                 </div>
                                 <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {item.description}
                                 </p>
                              </a>
                           </NavigationMenuLink>
                        );
                     })}
                  </div>
               </NavigationMenuContent>
            </NavigationMenuItem>

            {menuItems.map((item) => (
               <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                     asChild
                     className={cn(
                        navigationMenuTriggerStyle(),
                        "bg-transparent",
                        orientation === "vertical" && "justify-start w-full",
                     )}
                  >
                     <a href={item.href}>{item.name}</a>
                  </NavigationMenuLink>
               </NavigationMenuItem>
            ))}
         </NavigationMenuList>
      </NavigationMenu>
   );
};
