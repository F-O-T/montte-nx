"use client";

import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { cn } from "@packages/ui/lib/utils";
import {
   ChartPie,
   Check,
   ChevronDown,
   Cpu,
   HeartPulse,
   OctagonAlert,
   PanelsTopLeft,
   ShieldCheck,
   Truck,
   WalletCards,
   X,
} from "lucide-react";
import { useState } from "react";

type BillingPeriod = "monthly" | "annually";

interface PricingTier {
   name: string;
   description: string;
   monthlyPrice: number | null;
   yearlyPrice: number | null;
   popular?: boolean;
   features: string[];
   ctaText: string;
   ctaHref: string;
}

const pricingTiers: PricingTier[] = [
   {
      ctaHref: "/signup",
      ctaText: "Começar",
      description:
         "Para indivíduos começando com rastreamento de finanças pessoais",
      features: [
         "Transações ilimitadas",
         "Transações divididas básicas",
         "50 MB de armazenamento",
         "Anexos de recibos",
         "Importação de banco OFX",
      ],
      monthlyPrice: 0,
      name: "Grátis",
      yearlyPrice: 0,
   },
   {
      ctaHref: "/signup-pro",
      ctaText: "Começar",
      description:
         "Ideal para freelancers e pequenos empresários que precisam de mais recursos",
      features: [
         "Tudo do Plano Grátis, mais:",
         "Múltiplas contas (pessoal + empresarial)",
         "Rastreamento ilimitado de contas",
         "Cálculos de juros",
         "Análises avançadas",
         "5 GB de armazenamento",
         "Suporte prioritário por e-mail",
         "Exportação de relatórios financeiros",
         "Detecção de padrões recorrentes",
         "Previsão de orçamento",
      ],
      monthlyPrice: 49.99,
      name: "Pro",
      popular: true,
      yearlyPrice: 499.99,
   },
   {
      ctaHref: "/book-demo",
      ctaText: "Fale Conosco",
      description:
         "Para equipes, famílias e negócios em crescimento que precisam de recursos colaborativos",
      features: [
         "Tudo do Plano Pro, mais:",
         "Contas e membros ilimitados",
         "Orçamentos e workspaces compartilhados",
         "Controle de acesso por função",
         "Logs de auditoria e histórico",
         "100 GB de armazenamento",
         "Acesso à API (operações de leitura)",
         "Integração com webhooks",
         "Gestão de sessões",
         "Onboarding dedicado",
      ],
      monthlyPrice: 99.99,
      name: "Equipe",
      yearlyPrice: 999.99,
   },
   {
      ctaHref: "/contact-sales",
      ctaText: "Fale com Vendas",
      description:
         "Para grandes organizações que precisam de segurança avançada, conformidade e soluções personalizadas",
      features: [
         "Tudo do Plano Equipe, mais:",
         "Armazenamento ilimitado",
         "Acesso total à API (leitura/escrita)",
         "Autenticação SSO e SAML",
         "Integrações personalizadas",
         "Garantia de SLA",
         "Gerente de conta dedicado",
         "Termos de contrato personalizados",
         "Opção de implantação on-premise",
         "Suporte prioritário 24/7",
      ],
      monthlyPrice: null,
      name: "Enterprise",
      yearlyPrice: null,
   },
];

function PricingCard({
   tier,
   billingPeriod,
}: {
   tier: PricingTier;
   billingPeriod: BillingPeriod;
}) {
   const price =
      billingPeriod === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
   const isCustom = price === null;
   const isFree = price === 0;
   const monthlyEquivalent = tier.yearlyPrice
      ? (tier.yearlyPrice / 12).toFixed(2)
      : null;

   return (
      <div
         className={cn(
            "row-span-4 grid grid-rows-subgrid gap-8 rounded-xl p-8 ring-1",
            tier.popular
               ? "bg-card ring-border border border-transparent shadow-xl backdrop-blur"
               : "ring-border/50",
         )}
      >
         <div className="self-end">
            <div className="text-lg font-medium tracking-tight">
               {tier.name}
            </div>
            <div className="text-muted-foreground mt-1 text-balance text-sm">
               {tier.description}
            </div>
         </div>

         <div>
            {isCustom ? (
               <>
                  <span className="text-3xl font-semibold">Personalizado</span>
                  <div className="text-muted-foreground text-sm">
                     Entre em contato para preços
                  </div>
               </>
            ) : isFree ? (
               <>
                  <span className="text-3xl font-semibold">R$0</span>
                  <div className="text-muted-foreground text-sm">
                     Grátis para sempre
                  </div>
               </>
            ) : (
               <>
                  <span className="text-3xl font-semibold">
                     R$
                     {billingPeriod === "monthly"
                        ? tier.monthlyPrice
                        : monthlyEquivalent}
                  </span>
                  <div className="text-muted-foreground text-sm">Por mês</div>
                  {billingPeriod === "annually" && (
                     <div className="text-primary text-xs mt-1">
                        Cobrado R${tier.yearlyPrice} anualmente
                     </div>
                  )}
               </>
            )}
         </div>

         <a
            className={cn(
               "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 w-full",
               tier.popular
                  ? "shadow-md border-[0.5px] border-white/25 shadow-black/20 bg-primary text-primary-foreground hover:bg-primary/90"
                  : "shadow-sm shadow-black/15 border border-transparent bg-background ring-1 ring-foreground/10 hover:bg-muted/50 dark:ring-foreground/15",
            )}
            href={tier.ctaHref}
         >
            {tier.ctaText}
         </a>

         <ul className="space-y-4 text-sm">
            {tier.features.map((feature, index) => (
               <li
                  className={cn(
                     "group flex items-center gap-2",
                     index === 0 &&
                        (tier.name === "Pro" || tier.name === "Team") &&
                        "font-medium",
                  )}
                  key={feature}
               >
                  <Check
                     className={cn(
                        "text-muted-foreground size-3",
                        index === 0 &&
                           (tier.name === "Pro" || tier.name === "Team") &&
                           "hidden",
                     )}
                     strokeWidth={3.5}
                  />
                  {feature}
               </li>
            ))}
         </ul>
      </div>
   );
}

export function PricingCards() {
   const [billingPeriod, setBillingPeriod] =
      useState<BillingPeriod>("annually");

   return (
      <div>
         <div className="mb-12">
            <div
               className="bg-foreground/5 relative mx-auto grid w-fit grid-cols-2 rounded-full p-1"
               data-period={billingPeriod}
            >
               <div
                  aria-hidden="true"
                  className={cn(
                     "bg-card ring-foreground/5 pointer-events-none absolute inset-1 w-1/2 rounded-full border border-transparent shadow ring-1 transition-transform duration-500 ease-in-out",
                     billingPeriod === "annually"
                        ? "translate-x-full"
                        : "translate-x-0",
                  )}
               />
               <button
                  className={cn(
                     "relative block h-8 w-24 rounded-full text-sm hover:opacity-75",
                     billingPeriod === "monthly"
                        ? "text-foreground font-medium"
                        : "text-foreground/75",
                  )}
                  onClick={() => setBillingPeriod("monthly")}
                  type="button"
               >
                  Mensal
               </button>
               <button
                  className={cn(
                     "relative block h-8 w-24 rounded-full text-sm hover:opacity-75",
                     billingPeriod === "annually"
                        ? "text-foreground font-medium"
                        : "text-foreground/75",
                  )}
                  onClick={() => setBillingPeriod("annually")}
                  type="button"
               >
                  Anual
               </button>
            </div>
            <div className="mt-3 text-center text-xs">
               <span className="text-primary font-medium">Economize 17%</span>{" "}
               Na Cobrança Anual
            </div>
         </div>

         <div className="mx-auto max-w-sm lg:max-w-none">
            <div className="grid gap-6 lg:grid-cols-4">
               {pricingTiers.map((tier) => (
                  <PricingCard
                     billingPeriod={billingPeriod}
                     key={tier.name}
                     tier={tier}
                  />
               ))}
            </div>
         </div>
      </div>
   );
}

type FeatureValue = boolean | string;

interface ComparisonFeature {
   name: string;
   tooltip?: string;
   free: FeatureValue;
   pro: FeatureValue;
   team: FeatureValue;
   enterprise: FeatureValue;
}

interface ComparisonCategory {
   name: string;
   icon: React.ReactNode;
   features: ComparisonFeature[];
}

const comparisonData: ComparisonCategory[] = [
   {
      features: [
         {
            enterprise: "Ilimitado",
            free: "1",
            name: "Contas Suportadas",
            pro: "5",
            team: "Ilimitado",
            tooltip: "Número de contas financeiras",
         },
         {
            enterprise: "Ilimitado",
            free: "10/mês",
            name: "Rastreamento de Contas",
            pro: "Ilimitado",
            team: "Ilimitado",
            tooltip: "Rastreie contas e pagamentos recorrentes",
         },
         {
            enterprise: "Ilimitado",
            free: "1 máx",
            name: "Criação de Orçamento",
            pro: "Ilimitado",
            team: "Ilimitado",
            tooltip: "Crie e gerencie orçamentos",
         },
         {
            enterprise: "Avançado",
            free: "Básico",
            name: "Transações Divididas",
            pro: "Avançado",
            team: "Avançado",
            tooltip: "Divida transações entre categorias",
         },
      ],
      icon: <PanelsTopLeft className="size-4" />,
      name: "Plataforma",
   },
   {
      features: [
         {
            enterprise: "Ilimitado",
            free: "50 MB",
            name: "Armazenamento de Arquivos",
            pro: "5 GB",
            team: "100 GB",
            tooltip: "Armazenamento para recibos e anexos",
         },
         {
            enterprise: true,
            free: true,
            name: "Exportação de Dados",
            pro: true,
            team: true,
            tooltip: "Exporte seus dados financeiros",
         },
         {
            enterprise: "Acesso total",
            free: false,
            name: "Acesso à API",
            pro: false,
            team: "Somente leitura",
            tooltip: "Acesso programático aos seus dados",
         },
         {
            enterprise: true,
            free: false,
            name: "Webhooks",
            pro: false,
            team: true,
            tooltip: "Notificações de eventos em tempo real",
         },
      ],
      icon: <Cpu className="size-4" />,
      name: "Infraestrutura",
   },
   {
      features: [
         {
            enterprise: true,
            free: true,
            name: "Suporte da Comunidade",
            pro: true,
            team: true,
         },
         {
            enterprise: "1h",
            free: false,
            name: "Suporte por E-mail",
            pro: "24h",
            team: "4h",
            tooltip: "Garantia de tempo de resposta",
         },
         {
            enterprise: true,
            free: false,
            name: "Suporte Prioritário",
            pro: false,
            team: true,
         },
         {
            enterprise: true,
            free: false,
            name: "Onboarding Dedicado",
            pro: false,
            team: true,
         },
         {
            enterprise: true,
            free: false,
            name: "Gerente de Conta Dedicado",
            pro: false,
            team: false,
         },
         {
            enterprise: true,
            free: false,
            name: "Suporte 24/7",
            pro: false,
            team: false,
         },
      ],
      icon: <HeartPulse className="size-4" />,
      name: "Suporte",
   },
   {
      features: [
         {
            enterprise: true,
            free: true,
            name: "Relatórios Básicos",
            pro: true,
            team: true,
         },
         {
            enterprise: true,
            free: false,
            name: "Análises Avançadas",
            pro: true,
            team: true,
         },
         {
            enterprise: true,
            free: false,
            name: "Previsão Financeira",
            pro: true,
            team: true,
         },
         {
            enterprise: true,
            free: false,
            name: "Dashboards Personalizados",
            pro: false,
            team: true,
            tooltip: "Construa dashboards personalizados",
         },
      ],
      icon: <ChartPie className="size-4" />,
      name: "Análises",
   },
   {
      features: [
         {
            enterprise: true,
            free: false,
            name: "SSO e SAML",
            pro: false,
            team: false,
            tooltip: "Autenticação de login único",
         },
         {
            enterprise: true,
            free: false,
            name: "Logs de Auditoria",
            pro: false,
            team: true,
            tooltip: "Rastreie todas as atividades de usuários",
         },
         {
            enterprise: true,
            free: false,
            name: "Termos de Contrato Personalizados",
            pro: false,
            team: false,
         },
         {
            enterprise: true,
            free: false,
            name: "Implantação On-Premise",
            pro: false,
            team: false,
            tooltip: "Implante na sua própria infraestrutura",
         },
      ],
      icon: <ShieldCheck className="size-4" />,
      name: "Segurança e Conformidade",
   },
];

interface PlanInfo {
   id: "free" | "pro" | "team" | "enterprise";
   name: string;
   price: string;
   ctaText: string;
   ctaHref: string;
   highlighted?: boolean;
}

const planInfo: PlanInfo[] = [
   {
      ctaHref: "/signup",
      ctaText: "Começar",
      id: "free",
      name: "Grátis",
      price: "R$0 / mês",
   },
   {
      ctaHref: "/signup-pro",
      ctaText: "Iniciar teste grátis",
      highlighted: true,
      id: "pro",
      name: "Pro",
      price: "R$49,99 / mês",
   },
   {
      ctaHref: "/book-demo",
      ctaText: "Fale Conosco",
      id: "team",
      name: "Equipe",
      price: "R$99,99 / mês",
   },
   {
      ctaHref: "/contact-sales",
      ctaText: "Fale com Vendas",
      id: "enterprise",
      name: "Enterprise",
      price: "Personalizado",
   },
];

function FeatureValueDisplay({ value }: { value: FeatureValue }) {
   if (value === true) {
      return (
         <span
            aria-hidden="true"
            className="size-4.5 flex items-center justify-center"
         >
            <svg
               aria-hidden="true"
               className="size-3"
               height="16"
               viewBox="0 0 512 512"
               width="16"
               xmlns="http://www.w3.org/2000/svg"
            >
               <path
                  d="M17.47 250.9C88.82 328.1 158 397.6 224.5 485.5c72.3-143.8 146.3-288.1 268.4-444.37L460 26.06C356.9 135.4 276.8 238.9 207.2 361.9c-48.4-43.6-126.62-105.3-174.38-137z"
                  fill="currentColor"
               />
            </svg>
         </span>
      );
   }
   if (value === false) {
      return (
         <span
            aria-hidden="true"
            className="size-4.5 flex items-center justify-center"
         >
            <span className="bg-foreground/50 block size-1.5 rounded-full opacity-50" />
         </span>
      );
   }
   return (
      <span
         aria-hidden="true"
         className="size-4.5 flex items-center justify-center"
      >
         <svg
            aria-hidden="true"
            className="size-3"
            height="16"
            viewBox="0 0 512 512"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
         >
            <path
               d="M17.47 250.9C88.82 328.1 158 397.6 224.5 485.5c72.3-143.8 146.3-288.1 268.4-444.37L460 26.06C356.9 135.4 276.8 238.9 207.2 361.9c-48.4-43.6-126.62-105.3-174.38-137z"
               fill="currentColor"
            />
         </svg>
      </span>
   );
}

export function PricingComparison() {
   return (
      <div className="mx-auto max-w-6xl">
         <div className="rounded-xl ring-1 ring-border/50 overflow-hidden">
            <Table>
               <TableHeader>
                  <TableRow className="hover:bg-transparent">
                     <TableHead className="w-[200px] bg-muted/30 h-14 px-6">
                        <span className="text-base font-medium text-foreground">
                           Recursos
                        </span>
                     </TableHead>
                     {planInfo.map((plan) => (
                        <TableHead
                           className="bg-muted/30 h-14 px-4 text-center"
                           key={plan.id}
                        >
                           <div className="flex flex-col items-center gap-0.5">
                              <span
                                 className={cn(
                                    "text-sm font-medium",
                                    plan.highlighted
                                       ? "text-primary"
                                       : "text-foreground",
                                 )}
                              >
                                 {plan.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                 {plan.price}
                              </span>
                           </div>
                        </TableHead>
                     ))}
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {comparisonData.map((category) => (
                     <>
                        <TableRow
                           className="hover:bg-transparent bg-muted/20"
                           key={`category-${category.name}`}
                        >
                           <TableCell
                              className="px-6 py-3 font-medium"
                              colSpan={5}
                           >
                              <div className="flex items-center gap-2 [&>svg]:size-4">
                                 {category.icon}
                                 {category.name}
                              </div>
                           </TableCell>
                        </TableRow>
                        {category.features.map((feature) => (
                           <TableRow
                              className="hover:bg-muted/30"
                              key={feature.name}
                           >
                              <TableCell className="px-6 py-4">
                                 {feature.tooltip ? (
                                    <span className="text-sm text-muted-foreground cursor-help underline decoration-dotted underline-offset-2">
                                       {feature.name}
                                    </span>
                                 ) : (
                                    <span className="text-sm text-muted-foreground">
                                       {feature.name}
                                    </span>
                                 )}
                              </TableCell>
                              {planInfo.map((plan) => {
                                 const value = feature[plan.id];
                                 return (
                                    <TableCell
                                       className={cn(
                                          "px-4 py-4 text-center",
                                          value === false && "opacity-50",
                                       )}
                                       key={plan.id}
                                    >
                                       <div className="flex items-center justify-center gap-2">
                                          <FeatureValueDisplay value={value} />
                                          {typeof value === "string" && (
                                             <span className="text-sm text-muted-foreground">
                                                {value}
                                             </span>
                                          )}
                                       </div>
                                    </TableCell>
                                 );
                              })}
                           </TableRow>
                        ))}
                     </>
                  ))}
               </TableBody>
            </Table>
         </div>

         <div className="mt-8 flex flex-wrap justify-center gap-4">
            {planInfo.map((plan) => (
               <a
                  className={cn(
                     "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 rounded-md px-6 text-sm",
                     plan.highlighted
                        ? "shadow-md border-[0.5px] border-white/25 shadow-black/20 bg-primary text-primary-foreground hover:bg-primary/90"
                        : "shadow-sm shadow-black/15 border border-transparent bg-background ring-1 ring-foreground/10 hover:bg-muted/50 dark:ring-foreground/15",
                  )}
                  href={plan.ctaHref}
                  key={plan.id}
               >
                  {plan.name} - {plan.ctaText}
               </a>
            ))}
         </div>
      </div>
   );
}

interface FAQItem {
   question: string;
   answer: string;
}

interface FAQCategory {
   id: string;
   name: string;
   icon: React.ReactNode;
   items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
   {
      icon: <OctagonAlert className="size-4" />,
      id: "general",
      items: [
         {
            answer:
               "Tudo o que você precisa para começar com rastreamento moderno de despesas. Você recebe transações ilimitadas, rastreamento dividido, orçamento básico, importação de banco OFX e armazenamento de recibos (50 MB). Atualize para o Pro apenas quando precisar de recursos avançados como múltiplas contas, análises ou colaboração em equipe.",
            question: "O que está incluído no plano grátis?",
         },
         {
            answer:
               "Sim! O plano grátis é completamente gratuito para sempre. Você também pode auto-hospedar a versão open-source completamente grátis sem limites.",
            question: "Posso usar o Montte gratuitamente para sempre?",
         },
         {
            answer:
               "Auto-hospedagem é sempre gratuita e open source. Você implanta o Montte no seu próprio servidor e obtém todos os recursos localmente. Você não terá backups na nuvem ou suporte, mas você é dono dos seus dados completamente.",
            question: "E se eu auto-hospedar em vez de usar a nuvem?",
         },
         {
            answer:
               "Não. Todos os planos são cobrados mensalmente sem contrato. Você pode cancelar ou fazer upgrade a qualquer momento.",
            question: "Existe um contrato de longo prazo?",
         },
         {
            answer:
               "O preço do plano Equipe é personalizado baseado nas necessidades da sua organização. Entre em contato conosco para discutir seus requisitos e obter uma cotação personalizada.",
            question: "Como funciona o preço do plano Equipe?",
         },
      ],
      name: "Geral",
   },
   {
      icon: <WalletCards className="size-4" />,
      id: "billing",
      items: [
         {
            answer:
               "Aceitamos todos os principais cartões de crédito (Visa, Mastercard, American Express) e PIX. Para planos Enterprise, também oferecemos faturamento e transferência bancária.",
            question: "Quais formas de pagamento vocês aceitam?",
         },
         {
            answer:
               "Sim. Você pode fazer upgrade ou downgrade a qualquer momento. Você será cobrado proporcionalmente pela diferença entre os planos.",
            question: "Posso trocar de plano ou fazer downgrade?",
         },
         {
            answer:
               "Sim. Com cobrança anual, você economiza 17% em comparação com a cobrança mensal. Isso se aplica aos planos Pro.",
            question: "Vocês oferecem descontos para cobrança anual?",
         },
      ],
      name: "Cobrança",
   },
   {
      icon: <Truck className="size-4" />,
      id: "features",
      items: [
         {
            answer:
               "O plano Equipe inclui acesso básico à API (operações de leitura - listar, consultar, exportar). O plano Enterprise inclui acesso total à API (operações de leitura/escrita). Desenvolvedores da comunidade usando auto-hospedagem podem acessar a API open-source completa.",
            question: "E quanto ao acesso à API?",
         },
         {
            answer:
               "Sim. O plano Pro inclui um teste gratuito de 14 dias. Não é necessário cartão de crédito para iniciar o teste.",
            question: "Existe um teste gratuito para planos pagos?",
         },
         {
            answer:
               "Estamos confiantes de que você vai adorar o Montte. Se você não estiver satisfeito com o plano Pro, oferecemos garantia de devolução do dinheiro em 30 dias (menos taxas de transação). Planos Equipe têm termos de cancelamento personalizados.",
            question: "Vocês oferecem reembolso?",
         },
      ],
      name: "Recursos",
   },
];

export function PricingFAQ() {
   const [activeCategory, setActiveCategory] = useState("general");
   const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

   const toggleItem = (categoryId: string, index: number) => {
      const key = `${categoryId}-${index}`;
      setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
   };

   return (
      <div className="mx-auto max-w-5xl px-1 md:px-6">
         <div className="max-w-lg max-md:px-6">
            <h2 className="text-foreground text-4xl font-semibold">
               Perguntas Frequentes
            </h2>
            <p className="text-muted-foreground mt-4 text-balance text-lg">
               Descubra respostas rápidas e completas para perguntas comuns
               sobre nossa plataforma, serviços e recursos.
            </p>
         </div>

         <div className="mt-6 grid md:mt-20 md:grid-cols-5">
            <div className="max-md:bg-background/75 sticky top-14 z-10 h-fit backdrop-blur-sm max-md:flex max-md:justify-center max-md:border-b max-md:p-2 md:top-20 md:col-span-2 md:-mt-3 lg:-ml-3">
               {faqCategories.map((category) => (
                  <button
                     className="text-muted-foreground group max-md:px-1 md:block md:py-1 cursor-pointer"
                     data-state={
                        activeCategory === category.id ? "active" : "inactive"
                     }
                     key={category.id}
                     onClick={() => setActiveCategory(category.id)}
                     type="button"
                  >
                     <span
                        className={cn(
                           "flex w-fit items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors [&>svg]:size-4",
                           activeCategory === category.id
                              ? "bg-card ring-foreground/5 text-primary font-medium shadow-sm ring-1"
                              : "hover:text-foreground hover:bg-foreground/5",
                        )}
                     >
                        {category.icon}
                        <span className="max-xs:hidden">{category.name}</span>
                     </span>
                  </button>
               ))}
            </div>

            <div className="space-y-12 max-md:mt-6 md:col-span-3">
               {faqCategories.map((category) => (
                  <div
                     className={cn(
                        "scroll-mt-32 space-y-4",
                        activeCategory !== category.id && "hidden md:block",
                     )}
                     id={category.id}
                     key={category.id}
                  >
                     <h3 className="text-foreground pl-6 text-lg font-semibold">
                        {category.name}
                     </h3>
                     <div className="-space-y-1">
                        {category.items.map((item, index) => {
                           const isOpen = openItems[`${category.id}-${index}`];
                           return (
                              <div
                                 className="border-b last:border-b-0 data-[state=open]:bg-card data-[state=open]:ring-foreground/5 peer rounded-xl border-none px-6 py-1 data-[state=open]:border-none data-[state=open]:shadow-sm data-[state=open]:ring-1"
                                 data-state={isOpen ? "open" : "closed"}
                                 key={index}
                              >
                                 <h4 className="flex">
                                    <button
                                       className="focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 py-4 text-left font-medium outline-none focus-visible:ring-[3px] cursor-pointer rounded-none border-b text-base transition-none hover:no-underline data-[state=open]:border-transparent"
                                       data-state={isOpen ? "open" : "closed"}
                                       onClick={() =>
                                          toggleItem(category.id, index)
                                       }
                                       type="button"
                                    >
                                       {item.question}
                                       <ChevronDown
                                          className={cn(
                                             "text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200",
                                             isOpen && "rotate-180",
                                          )}
                                       />
                                    </button>
                                 </h4>
                                 {isOpen && (
                                    <div className="overflow-hidden text-sm pb-4">
                                       <p className="text-muted-foreground">
                                          {item.answer}
                                       </p>
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}

const transparencyData = {
   weDo: [
      "Cobramos um preço - só isso",
      "Deixamos você exportar dados a qualquer momento",
      "Oferecemos opção auto-hospedada (grátis)",
      "Damos testes gratuitos de 14 dias (sem cartão)",
      "Oferecemos flexibilidade mensal",
      "Mostramos exatamente o que está incluído",
   ],
   weDoNot: [
      "Temos taxas ocultas ou cobranças surpresa",
      "Cobramos por transação ou por relatório",
      "Vendemos recursos que deveriam ser grátis",
      "Bloqueamos seus dados atrás de assinatura",
      "Exigimos cartão de crédito para teste grátis",
      "Renovamos automaticamente sem confirmação",
   ],
};

export function TransparencyTable() {
   return (
      <div className="mx-auto max-w-5xl px-6 lg:px-2">
         <div className="mx-auto mb-12 max-w-xl text-balance text-center md:mb-16">
            <h2 className="text-2xl font-semibold md:text-3xl">
               Transparência
            </h2>
            <p className="text-muted-foreground mt-4">
               Acreditamos em ser diretos sobre o que fazemos e o que não
               fazemos.
            </p>
         </div>

         <div className="rounded-xl ring-1 ring-border/50 overflow-hidden">
            <Table>
               <TableHeader>
                  <TableRow className="hover:bg-transparent">
                     <TableHead className="w-1/2 bg-muted/30 h-14 px-6">
                        <div className="flex items-center gap-2 text-base font-medium text-foreground">
                           <X className="size-4 text-muted-foreground" />
                           Não Fazemos
                        </div>
                     </TableHead>
                     <TableHead className="w-1/2 bg-muted/30 h-14 px-6">
                        <div className="flex items-center gap-2 text-base font-medium text-foreground">
                           <ShieldCheck className="size-4 text-primary" />
                           Fazemos
                        </div>
                     </TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {transparencyData.weDoNot.map((item, index) => (
                     <TableRow className="hover:bg-muted/30" key={index}>
                        <TableCell className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <span className="size-4.5 flex items-center justify-center">
                                 <span className="bg-foreground/50 block size-1.5 rounded-full opacity-50" />
                              </span>
                              <span className="text-sm text-muted-foreground">
                                 {item}
                              </span>
                           </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <span
                                 aria-hidden="true"
                                 className="size-4.5 flex items-center justify-center"
                              >
                                 <svg
                                    aria-hidden="true"
                                    className="size-3"
                                    height="16"
                                    viewBox="0 0 512 512"
                                    width="16"
                                    xmlns="http://www.w3.org/2000/svg"
                                 >
                                    <path
                                       d="M17.47 250.9C88.82 328.1 158 397.6 224.5 485.5c72.3-143.8 146.3-288.1 268.4-444.37L460 26.06C356.9 135.4 276.8 238.9 207.2 361.9c-48.4-43.6-126.62-105.3-174.38-137z"
                                       fill="currentColor"
                                    />
                                 </svg>
                              </span>
                              <span className="text-sm text-muted-foreground">
                                 {transparencyData.weDo[index]}
                              </span>
                           </div>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </Table>
         </div>
      </div>
   );
}
