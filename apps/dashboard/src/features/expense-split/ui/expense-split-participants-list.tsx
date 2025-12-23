import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Progress } from "@packages/ui/components/progress";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";
import { Fragment } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { formatCurrency } from "../lib/split-calculator";
import { ExpenseSplitSettlementForm } from "./expense-split-settlement-form";

interface Participant {
   id: string;
   memberId: string;
   allocatedAmount: string;
   settledAmount: string;
   status: "pending" | "partial" | "settled";
   member: {
      id: string;
      userId: string;
      user: {
         id: string;
         name: string;
         email: string;
         image?: string | null;
      };
   };
}

interface ExpenseSplitParticipantsListProps {
   participants: Participant[];
   canRecordSettlements?: boolean;
}

const STATUS_CONFIG = {
   partial: {
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
      label: "Partial",
   },
   pending: {
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: Clock,
      label: "Pending",
   },
   settled: {
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle2,
      label: "Settled",
   },
};

export function ExpenseSplitParticipantsList({
   participants,
   canRecordSettlements = true,
}: ExpenseSplitParticipantsListProps) {
   const { openSheet } = useSheet();

   const handleRecordSettlement = (participant: Participant) => {
      const allocated = Number.parseFloat(participant.allocatedAmount);
      const settled = Number.parseFloat(participant.settledAmount);
      const remaining = allocated - settled;

      openSheet({
         children: (
            <ExpenseSplitSettlementForm
               participantId={participant.id}
               participantName={
                  participant.member.user.name || participant.member.user.email
               }
               remainingAmount={remaining}
            />
         ),
      });
   };

   return (
      <ItemGroup>
         {participants.map((participant, index) => {
            const allocated = Number.parseFloat(participant.allocatedAmount);
            const settled = Number.parseFloat(participant.settledAmount);
            const progressPercent = (settled / allocated) * 100;
            const statusConfig = STATUS_CONFIG[participant.status];
            const StatusIcon = statusConfig.icon;

            return (
               <Fragment key={participant.id}>
                  <Item>
                     <ItemMedia>
                        <Avatar className="size-10">
                           <AvatarImage
                              alt={participant.member.user.name}
                              src={participant.member.user.image || undefined}
                           />
                           <AvatarFallback>
                              {(
                                 participant.member.user.name ||
                                 participant.member.user.email ||
                                 "?"
                              )
                                 .charAt(0)
                                 .toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                     </ItemMedia>
                     <ItemContent className="flex-1">
                        <div className="flex items-center gap-2">
                           <ItemTitle>
                              {participant.member.user.name || "Unknown User"}
                           </ItemTitle>
                           <Badge
                              className={statusConfig.color}
                              variant="secondary"
                           >
                              <StatusIcon className="size-3 mr-1" />
                              {statusConfig.label}
                           </Badge>
                        </div>
                        <ItemDescription>
                           {formatCurrency(settled)} /{" "}
                           {formatCurrency(allocated)}
                        </ItemDescription>
                        <Progress
                           className="h-1.5 mt-2"
                           value={progressPercent}
                        />
                     </ItemContent>
                     {canRecordSettlements &&
                        participant.status !== "settled" && (
                           <ItemActions>
                              <Button
                                 onClick={() =>
                                    handleRecordSettlement(participant)
                                 }
                                 size="sm"
                                 variant="outline"
                              >
                                 <DollarSign className="size-4 mr-1" />
                                 Settle
                              </Button>
                           </ItemActions>
                        )}
                  </Item>
                  {index !== participants.length - 1 && <ItemSeparator />}
               </Fragment>
            );
         })}
      </ItemGroup>
   );
}
