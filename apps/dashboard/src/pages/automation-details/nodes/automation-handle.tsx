import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { Handle, type HandleProps, Position } from "@xyflow/react";

type AutomationHandleProps = HandleProps & {
   className?: string;
};

const POSITION_TOOLTIPS: Record<Position, { source: string; target: string }> =
   {
      [Position.Bottom]: {
         source: "Arraste para conectar ao proximo no",
         target: "Solte aqui para conectar",
      },
      [Position.Top]: {
         source: "Arraste para conectar ao no anterior",
         target: "Solte aqui para conectar",
      },
      [Position.Left]: {
         source: "Arraste para conectar",
         target: "Solte aqui para conectar",
      },
      [Position.Right]: {
         source: "Arraste para conectar ao proximo no",
         target: "Solte aqui para conectar",
      },
   };

export function AutomationHandle({
   className,
   type,
   position,
   ...props
}: AutomationHandleProps) {
   const tooltipText =
      type === "source"
         ? POSITION_TOOLTIPS[position].source
         : POSITION_TOOLTIPS[position].target;

   return (
      <Tooltip>
         <TooltipTrigger asChild>
            <Handle
               {...props}
               className={cn(
                  "!size-3 rounded-full border-2 transition-all duration-200",
                  "hover:!size-4 hover:!border-primary hover:!bg-primary/20",
                  "dark:border-secondary dark:bg-secondary",
                  "border-slate-300 bg-slate-100",
                  className,
               )}
               position={position}
               type={type}
            />
         </TooltipTrigger>
         <TooltipContent
            className="text-xs"
            side={
               position === Position.Bottom
                  ? "bottom"
                  : position === Position.Top
                    ? "top"
                    : position === Position.Left
                      ? "left"
                      : "right"
            }
         >
            {tooltipText}
         </TooltipContent>
      </Tooltip>
   );
}
