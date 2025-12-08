import {
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
   Accordion as BaseAccordion,
} from "@packages/ui/components/accordion";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";

export interface FAQItem {
   id: string;
   question: string;
   answer: string;
   category: string;
}

export interface FAQCategory {
   id: string;
   label: string;
}

interface Props {
   categories: FAQCategory[];
   items: FAQItem[];
}

export function FAQTabs({ categories, items }: Props) {
   const defaultCategory = categories[0]?.id ?? "pricing";
   return (
      <Tabs
         className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3"
         defaultValue={defaultCategory}
         orientation="vertical"
      >
         <TabsList className="text-muted-foreground inline-flex items-center justify-center rounded-lg h-max w-full flex-col gap-2 bg-transparent p-0">
            {categories.map((category) => (
               <TabsTrigger
                  className="w-full flex items-center justify-start rounded-lg px-6 py-2.5 text-base transition-all cursor-pointer border border-border bg-background text-foreground dark:text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/20 dark:data-[state=active]:text-primary dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:border-primary/20 hover:border-primary/20 hover:bg-primary/5"
                  key={category.id}
                  value={category.id}
               >
                  {category.label}
               </TabsTrigger>
            ))}
         </TabsList>

         <div className="lg:col-span-2">
            {categories.map((category) => {
               const filteredItems = items.filter(
                  (item) => item.category === category.id,
               );
               return (
                  <TabsContent
                     className="mt-0"
                     key={category.id}
                     value={category.id}
                  >
                     <div className="w-full rounded-lg border">
                        <BaseAccordion
                           collapsible
                           defaultValue={filteredItems[0]?.id}
                           type="single"
                        >
                           {filteredItems.map((item) => (
                              <AccordionItem
                                 className="border-b last:border-b-0"
                                 key={item.id}
                                 value={item.id}
                              >
                                 <AccordionTrigger className="cursor-pointer text-base font-medium hover:underline px-5 py-4 gap-4">
                                    {item.question}
                                 </AccordionTrigger>
                                 <AccordionContent className="px-5 pb-4 text-base text-muted-foreground">
                                    <p>{item.answer}</p>
                                 </AccordionContent>
                              </AccordionItem>
                           ))}
                        </BaseAccordion>
                     </div>
                  </TabsContent>
               );
            })}
         </div>
      </Tabs>
   );
}
