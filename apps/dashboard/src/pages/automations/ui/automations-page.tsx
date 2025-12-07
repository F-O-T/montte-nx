import { Button } from "@packages/ui/components/button";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { cn } from "@packages/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import {
   Activity,
   Infinity as InfinityIcon,
   Plus,
   Webhook,
   Zap,
} from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import {
   AutomationsListProvider,
   type TriggerTypeFilter,
   useAutomationsList,
} from "../features/automations-list-context";
import { AutomationsListSection } from "./automations-list-section";

function AutomationsPageContent() {
   const { activeOrganization } = useActiveOrganization();
   const { triggerType, setTriggerType } = useAutomationsList();

   const triggerChips = [
      {
         icon: InfinityIcon,
         label: "Todos",
         value: "" as const,
      },
      {
         icon: Zap,
         label: "Transação Criada",
         value: "transaction.created" as const,
      },
      {
         icon: Activity,
         label: "Transação Atualizada",
         value: "transaction.updated" as const,
      },
      {
         icon: Webhook,
         label: "Webhook",
         value: "webhook.received" as const,
      },
   ];

   return (
      <main className="space-y-4">
         <DefaultHeader
            actions={
               <Button asChild>
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/automations/new"
                  >
                     <Plus className="size-4" />
                     Nova Automação
                  </Link>
               </Button>
            }
            description="Crie regras para automatizar ações baseadas em transações e eventos externos."
            title="Automações"
         />

         <ToggleGroup
            className="flex-wrap justify-start"
            onValueChange={(value) =>
               setTriggerType((value || null) as TriggerTypeFilter | null)
            }
            size="sm"
            spacing={2}
            type="single"
            value={triggerType || ""}
            variant="outline"
         >
            {triggerChips.map((chip) => {
               const Icon = chip.icon;
               return (
                  <ToggleGroupItem
                     aria-label={`Toggle ${chip.value || "all"}`}
                     className={cn(
                        "gap-1.5 data-[state=on]:bg-transparent data-[state=on]:text-primary data-[state=on]:*:[svg]:stroke-primary",
                        "text-xs px-2 h-7",
                     )}
                     key={chip.value || "all"}
                     value={chip.value}
                  >
                     <Icon className="size-3" />
                     {chip.label}
                  </ToggleGroupItem>
               );
            })}
         </ToggleGroup>

         <AutomationsListSection />
      </main>
   );
}

export function AutomationsPage() {
   return (
      <AutomationsListProvider>
         <AutomationsPageContent />
      </AutomationsListProvider>
   );
}
