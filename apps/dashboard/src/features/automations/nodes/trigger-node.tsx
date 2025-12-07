import { BaseHandle } from "@packages/ui/components/base-handle";
import {
   BaseNode,
   BaseNodeContent,
   BaseNodeHeader,
   BaseNodeHeaderTitle,
} from "@packages/ui/components/base-node";
import type { NodeProps } from "@xyflow/react";
import { Position } from "@xyflow/react";
import { Zap } from "lucide-react";
import type { TriggerNode as TriggerNodeType } from "../lib/types";
import { TRIGGER_TYPE_LABELS } from "../lib/types";

export function TriggerNode({ data }: NodeProps<TriggerNodeType>) {
   return (
      <BaseNode className="min-w-[200px] border-emerald-500">
         <BaseNodeHeader className="rounded-t-md bg-emerald-500 text-white">
            <Zap className="size-4" />
            <BaseNodeHeaderTitle className="text-sm">
               Trigger
            </BaseNodeHeaderTitle>
         </BaseNodeHeader>
         <BaseNodeContent>
            <div className="text-sm font-medium">{data.label}</div>
            <div className="text-xs text-muted-foreground">
               {TRIGGER_TYPE_LABELS[data.triggerType]}
            </div>
            {data.config?.webhookSource && (
               <div className="text-xs text-muted-foreground">
                  Source: {data.config.webhookSource}
               </div>
            )}
         </BaseNodeContent>
         <BaseHandle
            className="!border-emerald-500"
            position={Position.Bottom}
            type="source"
         />
      </BaseNode>
   );
}
