import { BaseHandle } from "@packages/ui/components/base-handle";
import {
   BaseNode,
   BaseNodeContent,
   BaseNodeHeader,
   BaseNodeHeaderTitle,
} from "@packages/ui/components/base-node";
import type { NodeProps } from "@xyflow/react";
import { Position } from "@xyflow/react";
import { Play } from "lucide-react";
import type { ActionNode as ActionNodeType } from "../lib/types";
import { ACTION_TYPE_LABELS } from "../lib/types";

export function ActionNode({ data }: NodeProps<ActionNodeType>) {
   return (
      <BaseNode className="min-w-[200px] border-blue-500">
         <BaseHandle
            className="!border-blue-500"
            id="top"
            position={Position.Top}
            type="target"
         />
         <BaseHandle
            className="!border-blue-500"
            id="left"
            position={Position.Left}
            type="target"
         />
         <BaseNodeHeader className="rounded-t-md bg-blue-500 text-white">
            <Play className="size-4" />
            <BaseNodeHeaderTitle className="text-sm">
               {data.label}
            </BaseNodeHeaderTitle>
         </BaseNodeHeader>
         <BaseNodeContent>
            <div className="text-xs text-muted-foreground">
               {ACTION_TYPE_LABELS[data.actionType]}
            </div>
            {data.continueOnError && (
               <div className="text-xs text-amber-600">
                  Continua em caso de erro
               </div>
            )}
         </BaseNodeContent>
         <BaseHandle
            className="!border-blue-500"
            id="bottom"
            position={Position.Bottom}
            type="source"
         />
         <BaseHandle
            className="!border-blue-500"
            id="right"
            position={Position.Right}
            type="source"
         />
      </BaseNode>
   );
}
