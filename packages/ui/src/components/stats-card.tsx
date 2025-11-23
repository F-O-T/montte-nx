import { Card, CardDescription, CardHeader, CardTitle } from "./card";

type Values = {
   title: string;
   description: string;
   value: number | string;
};
interface StatsCardProps {
   className?: string;
   title: Values["title"];
   description: Values["description"];
   value: Values["value"];
}

export function StatsCard({
   className,
   title,
   description,
   value,
}: StatsCardProps) {
   return (
      <Card className={className ?? "col-span-1 h-full w-full"}>
         <CardHeader>
            <CardDescription className="text-base">{title}</CardDescription>
            <CardTitle className="text-xl">{value}</CardTitle>
            <CardDescription className="text-base">
               {description}
            </CardDescription>
         </CardHeader>
      </Card>
   );
}
