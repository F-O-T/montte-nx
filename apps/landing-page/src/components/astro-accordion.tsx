import {
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
   Accordion as BaseAccordion,
} from "@packages/ui/components/accordion";

interface Props {
   data: {
      id: string;
      question: string;
      answer: string;
   }[];
}

export function AstroAccordion({ data }: Props) {
   return (
      <BaseAccordion className="space-y-4" collapsible type="single">
         {data.map((item) => {
            return (
               <AccordionItem
                  className="p-4 rounded-lg bg-secondary/50 dark:bg-secondary/30 border border-primary/20 hover:border-primary/30 transition-all"
                  key={item.id}
                  value={item.id}
               >
                  <AccordionTrigger className="cursor-pointer text-lg font-semibold text-foreground hover:no-underline">
                     {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                     <p>{item.answer}</p>
                  </AccordionContent>
               </AccordionItem>
            );
         })}
      </BaseAccordion>
   );
}
