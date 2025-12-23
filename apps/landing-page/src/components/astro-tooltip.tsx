import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";

interface AstroTooltipProps {
   children: React.ReactNode;
   content: React.ReactNode;
}

export function AstroTooltip({ children, content }: AstroTooltipProps) {
   return (
      <Tooltip>
         <TooltipTrigger className=" flex shrink-0 items-center justify-center">
            {children}
         </TooltipTrigger>
         <TooltipContent>{content}</TooltipContent>
      </Tooltip>
   );
}
