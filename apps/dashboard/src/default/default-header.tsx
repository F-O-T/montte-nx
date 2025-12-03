import type { ReactNode } from "react";

interface DefaultHeaderProps {
   title: string;
   description: string;
   actions?: ReactNode;
}

export function DefaultHeader({
   title,
   description,
   actions,
}: DefaultHeaderProps) {
   return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
         <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight">
               {title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed max-w-3xl">
               {description}
            </p>
         </div>
         {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
         )}
      </div>
   );
}
