import {
   CredenzaBody,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { cn } from "@packages/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
   ArrowDownRight,
   ArrowUpRight,
   BarChart3,
   Building2,
   FileText,
   Landmark,
   type LucideIcon,
   Percent,
   Settings,
   Tag,
   Users,
   Wallet,
} from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useCredenza } from "@/hooks/use-credenza";
import { useHaptic } from "@/hooks/use-haptic";

interface NavItem {
   icon: LucideIcon;
   id: string;
   label: string;
   url: string;
}

const sections: { title: string; items: NavItem[] }[] = [
   {
      items: [
         {
            icon: Building2,
            id: "bank-accounts",
            label: "Contas Bancárias",
            url: "/$slug/bank-accounts",
         },
         {
            icon: BarChart3,
            id: "reports",
            label: "Relatórios",
            url: "/$slug/reports",
         },
         {
            icon: Wallet,
            id: "budgets",
            label: "Orçamentos",
            url: "/$slug/budgets",
         },
      ],
      title: "Suas finanças",
   },
   {
      items: [
         {
            icon: ArrowDownRight,
            id: "payables",
            label: "A Pagar",
            url: "/$slug/bills?type=payable",
         },
         {
            icon: ArrowUpRight,
            id: "receivables",
            label: "A Receber",
            url: "/$slug/bills?type=receivable",
         },
         {
            icon: Users,
            id: "counterparties",
            label: "Fornecedores",
            url: "/$slug/counterparties",
         },
         {
            icon: Percent,
            id: "interest-templates",
            label: "Modelos de Juros",
            url: "/$slug/interest-templates",
         },
      ],
      title: "Contas",
   },
   {
      items: [
         {
            icon: FileText,
            id: "categories",
            label: "Categorias",
            url: "/$slug/categories",
         },
         {
            icon: Landmark,
            id: "cost-centers",
            label: "Centros de Custo",
            url: "/$slug/cost-centers",
         },
         {
            icon: Tag,
            id: "tags",
            label: "Tags",
            url: "/$slug/tags",
         },
      ],
      title: "Categorização",
   },
   {
      items: [
         {
            icon: Settings,
            id: "profile",
            label: "Perfil",
            url: "/$slug/profile",
         },
      ],
      title: "Conta",
   },
];

export function MoreMenuCredenza() {
   const { activeOrganization } = useActiveOrganization();
   const { closeCredenza } = useCredenza();
   const { trigger: haptic } = useHaptic();

   const handleItemClick = () => {
      haptic("light");
      closeCredenza();
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Menu</CredenzaTitle>
         </CredenzaHeader>
         <CredenzaBody className="pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-6">
               {sections.map((section) => (
                  <div key={section.title}>
                     <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                     </h3>
                     <div className="grid grid-cols-3 gap-2">
                        {section.items.map((item) => {
                           const Icon = item.icon;
                           return (
                              <Link
                                 className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-3",
                                    "rounded-xl border bg-card",
                                    "transition-colors active:bg-accent",
                                 )}
                                 key={item.id}
                                 onClick={handleItemClick}
                                 params={{ slug: activeOrganization.slug }}
                                 to={item.url}
                              >
                                 <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                    <Icon className="size-5 text-primary" />
                                 </div>
                                 <span className="text-center text-xs font-medium leading-tight">
                                    {item.label}
                                 </span>
                              </Link>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>
         </CredenzaBody>
      </>
   );
}
