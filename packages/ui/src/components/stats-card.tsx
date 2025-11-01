import { Info as InfoIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "./button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "./card";
import {
   Credenza,
   CredenzaBody,
   CredenzaContent,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
   CredenzaTrigger,
} from "./credenza";

type Values = {
   title: string;
   description: string;
   value: number | string;
};
interface DetailsProps {
   className?: string;
   title: Values["title"];
   description: Values["description"];
   value: Values["value"];
   details?: Values[];
}

function StatsContent({
   className,
   title,
   description,
   value,
   showAction,
}: {
   className?: string;
   title: Values["title"];
   description: Values["description"];
   value: Values["value"];
   showAction?: React.ReactNode;
}) {
   return (
      <Card className={className ?? "col-span-1 h-full w-full"}>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
            {showAction ? <CardAction>{showAction}</CardAction> : null}
         </CardHeader>
         <CardContent className="font-bold text-4xl">{value}</CardContent>
      </Card>
   );
}

export function StatsCard({ className, details, ...props }: DetailsProps) {
   const content = (
      <StatsContent
         className={className}
         description={props.description}
         title={props.title}
         value={props.value}
      />
   );

   // If no details prop provided, render the card as-is
   if (!details) return content;

   // When details are provided, render a card with a CardAction that opens a Credenza
   return (
      <Credenza>
         <div className="col-span-1">
            <StatsContent
               className={className}
               description={props.description}
               showAction={
                  <CredenzaTrigger>
                     <Button size="icon" variant="ghost">
                        <InfoIcon />
                     </Button>
                  </CredenzaTrigger>
               }
               title={props.title}
               value={props.value}
            />
         </div>

         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Details</CredenzaTitle>
               <CredenzaDescription>
                  More information about {props.title.toLowerCase()}
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {details.map((detail) => (
                  <StatsContent
                     className="w-full"
                     description={detail.description}
                     key={detail.title}
                     title={detail.title}
                     value={detail.value}
                  />
               ))}
            </CredenzaBody>
         </CredenzaContent>
      </Credenza>
   );
}
