import {
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
   Accordion as BaseAccordion,
} from "@packages/ui/components/accordion";
import { cn } from "@packages/ui/lib/utils";
import {
   Briefcase,
   ChevronRight,
   CreditCard,
   Headphones,
   Lock,
} from "lucide-react";
import { useState } from "react";

interface FAQItem {
   id: string;
   question: string;
   answer: string;
   category: string;
}

interface Category {
   id: string;
   label: string;
   icon: React.ComponentType<{ className?: string }>;
}

const categories: Category[] = [
   { icon: Briefcase, id: "general", label: "Perguntas Gerais" },
   { icon: Lock, id: "security", label: "Seguranca" },
   { icon: CreditCard, id: "payment", label: "Pagamentos" },
   { icon: Headphones, id: "support", label: "Suporte" },
];

const faqItems: FAQItem[] = [
   {
      answer:
         "Sim! O Montte suporta importacao de arquivos OFX, que e o formato padrao utilizado pela maioria dos bancos brasileiros. Basta exportar o extrato do seu banco e fazer upload no sistema.",
      category: "general",
      id: "item-1",
      question: "Posso importar extratos do meu banco?",
   },
   {
      answer:
         "Voce pode gerenciar contas correntes, poupanca, investimentos, carteiras digitais e muito mais. Nao ha limite para o numero de contas que voce pode adicionar.",
      category: "general",
      id: "item-2",
      question: "Quais tipos de contas posso cadastrar?",
   },
   {
      answer:
         "Suas transacoes sao categorizadas automaticamente com base em padroes identificados. Voce tambem pode criar categorias personalizadas e ajustar manualmente sempre que precisar.",
      category: "general",
      id: "item-3",
      question: "Como funciona a categorizacao de transacoes?",
   },
   {
      answer:
         "Sim! Voce pode definir orcamentos mensais por categoria e acompanhar em tempo real quanto ja gastou. O sistema envia alertas quando voce estiver proximo do limite.",
      category: "general",
      id: "item-4",
      question: "Consigo definir orcamentos e metas?",
   },
   {
      answer:
         "Seus dados sao armazenados de forma segura com criptografia. Por ser open source, voce pode verificar exatamente como seus dados sao tratados ou ate mesmo hospedar sua propria instancia.",
      category: "security",
      id: "item-5",
      question: "Meus dados financeiros estao seguros?",
   },
   {
      answer:
         "Utilizamos criptografia de ponta a ponta e seguimos as melhores praticas de seguranca. Seus dados nunca sao compartilhados com terceiros sem sua autorizacao explicita.",
      category: "security",
      id: "item-6",
      question: "Como meus dados sao protegidos?",
   },
   {
      answer:
         "Nao armazenamos suas credenciais bancarias. A importacao e feita via arquivos OFX que voce exporta manualmente do seu banco, garantindo total controle sobre seus dados.",
      category: "security",
      id: "item-7",
      question: "Voces tem acesso a minha conta bancaria?",
   },
   {
      answer:
         "Durante a fase Alpha, o Montte e 100% gratuito. Apos o lancamento, ofereceremos planos pagos para quem quiser usar nossa infraestrutura gerenciada. Para quem preferir fazer self-host, o Montte sera sempre gratuito e open source - todo o codigo esta disponivel no GitHub.",
      category: "payment",
      id: "item-8",
      question: "O Montte e realmente gratuito?",
   },
   {
      answer:
         "Apos o lancamento, aceitaremos cartoes de credito, PIX e boleto bancario para os planos pagos da versao hospedada.",
      category: "payment",
      id: "item-9",
      question: "Quais formas de pagamento sao aceitas?",
   },
   {
      answer:
         "Sim! Voce pode cancelar a qualquer momento sem taxas ou penalidades. Seus dados permanecem disponiveis para exportacao.",
      category: "payment",
      id: "item-10",
      question: "Posso cancelar minha assinatura a qualquer momento?",
   },
   {
      answer:
         "Oferecemos suporte via email e atraves da nossa comunidade no Discord. Usuarios dos planos pagos terao acesso a suporte prioritario.",
      category: "support",
      id: "item-11",
      question: "Como posso entrar em contato com o suporte?",
   },
   {
      answer:
         "Temos uma base de conhecimento completa com tutoriais e guias. Alem disso, nossa comunidade no Discord e muito ativa e pode ajudar com duvidas.",
      category: "support",
      id: "item-12",
      question: "Existe documentacao ou tutoriais disponiveis?",
   },
   {
      answer:
         "Sim! Adoramos contribuicoes. Voce pode reportar bugs, sugerir funcionalidades ou contribuir com codigo diretamente no nosso repositorio GitHub.",
      category: "support",
      id: "item-13",
      question: "Posso contribuir com o projeto?",
   },
];

export function FAQTabs() {
   const [activeCategory, setActiveCategory] = useState("general");

   const filteredItems = faqItems.filter(
      (item) => item.category === activeCategory,
   );

   return (
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
         <div className="space-y-2">
            {categories.map((category) => {
               const Icon = category.icon;
               const isActive = activeCategory === category.id;
               return (
                  <button
                     className={cn(
                        "w-full flex items-center gap-2 rounded-lg border px-6 py-2.5 text-base font-medium transition-all cursor-pointer",
                        isActive
                           ? "bg-primary/10 text-primary border-primary/20"
                           : "bg-background text-foreground border-border hover:border-primary/20 hover:bg-primary/5",
                     )}
                     key={category.id}
                     onClick={() => setActiveCategory(category.id)}
                     type="button"
                  >
                     <Icon className="size-4" />
                     <span className="flex-1 text-start">{category.label}</span>
                     <ChevronRight className="size-4" />
                  </button>
               );
            })}
         </div>

         <div className="lg:col-span-2">
            <div className="w-full rounded-lg border">
               <BaseAccordion collapsible key={activeCategory} type="single">
                  {filteredItems.map((item) => (
                     <AccordionItem
                        className="border-b last:border-b-0"
                        key={item.id}
                        value={item.id}
                     >
                        <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                           {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                           <p className="text-base">{item.answer}</p>
                        </AccordionContent>
                     </AccordionItem>
                  ))}
               </BaseAccordion>
            </div>
         </div>
      </div>
   );
}
