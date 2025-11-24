interface DefaultHeaderProps {
   title: string;
   description: string;
}

export function DefaultHeader({ title, description }: DefaultHeaderProps) {
   return (
      <div className="flex flex-col gap-2 ">
         <h1 className="text-3xl md:text-4xl  font-bold tracking-tight font-serif leading-tight">
            {title}
         </h1>
         <p className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed max-w-3xl">
            {description}
         </p>
      </div>
   );
}
