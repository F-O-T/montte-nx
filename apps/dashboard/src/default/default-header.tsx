interface DefaultHeaderProps {
   title: string;
   description: string;
}

export function DefaultHeader({ title, description }: DefaultHeaderProps) {
   return (
      <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-bold tracking-tight font-sans">
            {title}
         </h1>
         <h4 className="text-muted-foreground font-serif">{description}</h4>
      </div>
   );
}
