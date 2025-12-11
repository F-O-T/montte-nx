import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { Separator } from "@packages/ui/components/separator";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { Panel, useReactFlow } from "@xyflow/react";
import {
   Cable,
   LayoutGrid,
   Maximize,
   Minus,
   Plus,
   RotateCcw,
} from "lucide-react";

type CanvasToolbarProps = {
   showConnections: boolean;
   onToggleConnections: () => void;
   onAutoLayout: () => void;
   className?: string;
};

export function CanvasToolbar({
   showConnections,
   onToggleConnections,
   onAutoLayout,
   className,
}: CanvasToolbarProps) {
   const { zoomIn, zoomOut, fitView } = useReactFlow();

   const handleResetCanvas = () => {
      fitView({ duration: 300, padding: 0.2 });
   };

   return (
      <Panel
         className={cn(
            "bg-primary-foreground text-foreground flex flex-col gap-1 ",
            className,
         )}
         position="top-left"
      >
         <DropdownMenu>
            <Tooltip>
               <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="outline">
                        <LayoutGrid className="size-4" />
                     </Button>
                  </DropdownMenuTrigger>
               </TooltipTrigger>
               <TooltipContent side="right">Menu</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" side="right">
               <DropdownMenuCheckboxItem
                  checked={showConnections}
                  onCheckedChange={onToggleConnections}
               >
                  <Cable className="mr-2 size-4" />
                  {showConnections ? "Esconder Conexoes" : "Mostrar Conexoes"}
               </DropdownMenuCheckboxItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={onAutoLayout}>
                  <LayoutGrid className="mr-2 size-4" />
                  Auto Layout
               </DropdownMenuItem>
               <DropdownMenuItem onClick={handleResetCanvas}>
                  <RotateCcw className="mr-2 size-4" />
                  Resetar Canvas
               </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>

         <Separator className="my-0.5" />

         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  onClick={() => zoomIn({ duration: 300 })}
                  size="icon"
                  variant="outline"
               >
                  <Plus className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Aumentar Zoom</TooltipContent>
         </Tooltip>

         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  onClick={() => zoomOut({ duration: 300 })}
                  size="icon"
                  variant="outline"
               >
                  <Minus className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Diminuir Zoom</TooltipContent>
         </Tooltip>

         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  onClick={() => fitView({ duration: 300 })}
                  size="icon"
                  variant="outline"
               >
                  <Maximize className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Ajustar a Tela</TooltipContent>
         </Tooltip>
      </Panel>
   );
}
