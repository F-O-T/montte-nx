import { Badge } from "@packages/ui/components/badge";
import { BaseHandle } from "@packages/ui/components/base-handle";
import {
   BaseNode,
   BaseNodeContent,
   BaseNodeHeader,
   BaseNodeHeaderTitle,
} from "@packages/ui/components/base-node";
import type { NodeProps } from "@xyflow/react";
import { Position } from "@xyflow/react";
import { Filter } from "lucide-react";
import type { ConditionNode as ConditionNodeType } from "../lib/types";
import { CONDITION_OPERATOR_LABELS } from "../lib/types";

export function ConditionNode({ data }: NodeProps<ConditionNodeType>) {
   return (
      <BaseNode className="min-w-[200px] border-amber-500">
         <BaseHandle
            className="!border-amber-500"
            id="top"
            position={Position.Top}
            type="target"
         />
         <BaseHandle
            className="!border-amber-500"
            id="left"
            position={Position.Left}
            type="target"
         />
         <BaseNodeHeader className="rounded-t-md bg-amber-500 text-white">
            <Filter className="size-4" />
            <BaseNodeHeaderTitle className="text-sm">
               {data.label}
            </BaseNodeHeaderTitle>
            <Badge className="bg-amber-600 text-white" variant="secondary">
               {data.operator}
            </Badge>
         </BaseNodeHeader>
         <BaseNodeContent>
            {data.conditions.length > 0 && (
               <div className="space-y-1">
                  {data.conditions.slice(0, 3).map((condition) => (
                     <div
                        className="text-xs text-muted-foreground"
                        key={condition.id}
                     >
                        {condition.field}{" "}
                        {CONDITION_OPERATOR_LABELS[condition.operator]}{" "}
                        {String(condition.value)}
                     </div>
                  ))}
                  {data.conditions.length > 3 && (
                     <div className="text-xs text-muted-foreground">
                        +{data.conditions.length - 3} mais
                     </div>
                  )}
               </div>
            )}
         </BaseNodeContent>
         <BaseHandle
            className="!border-amber-500"
            id="bottom"
            position={Position.Bottom}
            type="source"
         />
         <BaseHandle
            className="!border-amber-500"
            id="right"
            position={Position.Right}
            type="source"
         />
      </BaseNode>
   );
}
