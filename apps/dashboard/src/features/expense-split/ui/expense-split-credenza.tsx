import { Badge } from "@packages/ui/components/badge";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Calendar, Receipt, Users } from "lucide-react";
import { Suspense } from "react";
import { useTRPC } from "@/integrations/clients";
import { formatCurrency } from "../lib/split-calculator";
import { ExpenseSplitParticipantsList } from "./expense-split-participants-list";

interface ExpenseSplitCredenzaProps {
   splitId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

const SPLIT_TYPE_LABELS = {
   amount: "Custom Amounts",
   equal: "Equal Split",
   percentage: "Percentage Split",
   shares: "Shares Split",
};

function ExpenseSplitContent({ splitId }: { splitId: string }) {
   const trpc = useTRPC();

   const { data: split } = useSuspenseQuery(
      trpc.expenseSplits.getById.queryOptions({ id: splitId }),
   );

   if (!split) {
      return (
         <div className="py-8 text-center text-muted-foreground">
            Expense split not found
         </div>
      );
   }

   const totalSettled = split.participants.reduce(
      (sum, p) => sum + Number.parseFloat(p.settledAmount),
      0,
   );
   const totalAmount = Number.parseFloat(split.totalAmount);
   const progressPercent = (totalSettled / totalAmount) * 100;

   return (
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted">
               <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Receipt className="size-4" />
                  Total Amount
               </div>
               <div className="text-xl font-semibold">
                  {formatCurrency(split.totalAmount)}
               </div>
            </div>

            <div className="p-3 rounded-lg bg-muted">
               <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="size-4" />
                  Participants
               </div>
               <div className="text-xl font-semibold">
                  {split.participants.length}
               </div>
            </div>
         </div>

         <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
               <span className="text-muted-foreground">
                  Settlement Progress
               </span>
               <span className="font-medium">
                  {formatCurrency(totalSettled)} / {formatCurrency(totalAmount)}{" "}
                  ({progressPercent.toFixed(0)}%)
               </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
               <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPercent}%` }}
               />
            </div>
         </div>

         <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
               {
                  SPLIT_TYPE_LABELS[
                     split.splitType as keyof typeof SPLIT_TYPE_LABELS
                  ]
               }
            </Badge>
            {split.team && (
               <Badge variant="secondary">Team: {split.team.name}</Badge>
            )}
            <Badge className="flex items-center gap-1" variant="outline">
               <Calendar className="size-3" />
               {new Date(split.createdAt).toLocaleDateString()}
            </Badge>
         </div>

         {split.description && (
            <div className="p-3 rounded-lg bg-muted">
               <div className="text-sm text-muted-foreground mb-1">
                  Description
               </div>
               <div>{split.description}</div>
            </div>
         )}

         <div>
            <h4 className="font-medium mb-3">Participants</h4>
            <ExpenseSplitParticipantsList
               canRecordSettlements
               participants={split.participants as never[]}
            />
         </div>
      </div>
   );
}

function ExpenseSplitSkeleton() {
   return (
      <div className="space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
         </div>
         <Skeleton className="h-8" />
         <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
         </div>
         <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
         </div>
      </div>
   );
}

export function ExpenseSplitCredenza({
   splitId,
   open,
   onOpenChange,
}: ExpenseSplitCredenzaProps) {
   return (
      <Credenza onOpenChange={onOpenChange} open={open}>
         <CredenzaContent className="max-w-lg">
            <CredenzaHeader>
               <CredenzaTitle>Expense Split Details</CredenzaTitle>
               <CredenzaDescription>
                  View and manage expense split participants and settlements
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
               <Suspense fallback={<ExpenseSplitSkeleton />}>
                  <ExpenseSplitContent splitId={splitId} />
               </Suspense>
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
