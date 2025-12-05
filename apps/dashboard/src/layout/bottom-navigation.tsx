import { cn } from "@packages/ui/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, CirclePlus, Home, Receipt, TrendingUp } from "lucide-react";
import { ManageTransactionForm } from "@/features/transaction/ui/manage-transaction-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useHaptic } from "@/hooks/use-haptic";
import { useSheet } from "@/hooks/use-sheet";

const navItems = [
   {
      icon: Home,
      id: "home",
      label: "Início",
      to: "/$slug/home",
   },
   {
      icon: TrendingUp,
      id: "transactions",
      label: "Transações",
      to: "/$slug/transactions",
   },
   {
      icon: null,
      id: "add",
      label: "Nova",
      to: null,
   },
   {
      icon: Receipt,
      id: "bills",
      label: "Contas",
      to: "/$slug/bills",
   },
   {
      icon: BarChart3,
      id: "reports",
      label: "Relatórios",
      to: "/$slug/reports",
   },
] as const;

export function BottomNavigation() {
   const { pathname } = useLocation();
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { trigger: haptic } = useHaptic();

   const isActive = (to: string | null) => {
      if (!to) return false;
      const resolved = to.replace("$slug", activeOrganization.slug);
      return pathname.startsWith(resolved);
   };

   const handleAddClick = () => {
      haptic("medium");
      openSheet({ children: <ManageTransactionForm /> });
   };

   return (
      <nav
         className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "bg-background/80 backdrop-blur-lg border-t",
            "pb-[env(safe-area-inset-bottom)]",
         )}
      >
         <div className="flex h-16 items-center justify-around px-2">
            {navItems.map((item) => {
               if (item.id === "add") {
                  return (
                     <button
                        className={cn(
                           "flex flex-col items-center justify-center",
                           "-mt-6",
                        )}
                        key={item.id}
                        onClick={handleAddClick}
                        type="button"
                     >
                        <div
                           className={cn(
                              "flex size-14 items-center justify-center",
                              "rounded-full bg-primary text-primary-foreground",
                              "shadow-lg shadow-primary/25",
                              "active:scale-95 transition-transform",
                           )}
                        >
                           <CirclePlus className="size-7" />
                        </div>
                     </button>
                  );
               }

               const Icon = item.icon;
               const active = isActive(item.to);

               return (
                  <Link
                     className={cn(
                        "flex flex-col items-center justify-center gap-1",
                        "min-w-[4rem] py-2",
                        "transition-colors",
                        active
                           ? "text-primary"
                           : "text-muted-foreground active:text-primary",
                     )}
                     key={item.id}
                     onClick={() => haptic("light")}
                     params={{ slug: activeOrganization.slug }}
                     to={item.to}
                  >
                     {Icon && (
                        <Icon
                           className={cn("size-6", active && "fill-primary/20")}
                        />
                     )}
                     <span className="text-xs font-medium">{item.label}</span>
                  </Link>
               );
            })}
         </div>
      </nav>
   );
}
