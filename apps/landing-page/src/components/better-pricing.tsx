"use client";

import { cn } from "@packages/ui/lib/utils";
import { Check } from "lucide-react";
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
      ctaText: "Começar grátis",
      description: "Para projetos pessoais",
      features: [
         "Transações ilimitadas",
         "Importação de banco OFX",
         "50 MB de armazenamento",
         "Transações divididas básicas",
         "Anexos de recibos",
         "Suporte da comunidade",
      ],
      monthlyPrice: 0,
      name: "Grátis",
      yearlyPrice: 0,
   },
   {
      ctaHref: "/signup-pro",
      ctaText: "Iniciar teste",
      description: "Para equipes de produção",
      features: [
         "Membros de equipe ilimitados (grátis)",
         "Análises avançadas ilimitadas",
         "Múltiplas contas (pessoal + empresarial)",
         "Previsão de orçamento",
         "Detecção de padrões recorrentes",
         "Suporte prioritário por e-mail",
      ],
      monthlyPrice: 49.99,
      name: "Pro",
      popular: true,
      yearlyPrice: 499.99,
   },
];

interface Bundle {
   title: string;
   priceMonthly: string;
   priceYearly: string;
   save: string;
   features: { label: string; value: string }[];
}

const bundles: Bundle[] = [
   {
      title: "Starter",
      priceMonthly: "R$29",
      priceYearly: "R$24",
      save: "17%",
      features: [
         { label: "Contas", value: "5" },
         { label: "Armazenamento", value: "1 GB" },
         { label: "Relatórios", value: "10/mês" },
      ],
   },
   {
      title: "Growth",
      priceMonthly: "R$79",
      priceYearly: "R$66",
      save: "17%",
      features: [
         { label: "Contas", value: "15" },
         { label: "Armazenamento", value: "5 GB" },
         { label: "Relatórios", value: "50/mês" },
      ],
   },
   {
      title: "Scale",
      priceMonthly: "R$149",
      priceYearly: "R$124",
      save: "17%",
      features: [
         { label: "Contas", value: "50" },
         { label: "Armazenamento", value: "25 GB" },
         { label: "Relatórios", value: "200/mês" },
      ],
   },
   {
      title: "Enterprise",
      priceMonthly: "R$299",
      priceYearly: "R$249",
      save: "17%",
      features: [
         { label: "Contas", value: "Ilimitado" },
         { label: "Armazenamento", value: "100 GB" },
         { label: "Relatórios", value: "Ilimitado" },
      ],
   },
];

function IconCheck({ className }: { className?: string }) {
   return (
      <Check
         className={cn(
            "size-4 shrink-0 mt-0.5",
            className || "text-muted-foreground",
         )}
         strokeWidth={2}
      />
   );
}

function Feature({ label, value }: { label: string; value: string }) {
   return (
      <div className="flex justify-between items-center text-sm">
         <span className="text-muted-foreground">{label}</span>
         <span className="text-foreground font-medium">{value}</span>
      </div>
   );
}

function BundleCard({
   bundle,
   isYearly,
}: {
   bundle: Bundle;
   isYearly: boolean;
}) {
   return (
      <div className="rounded-lg border border-border/50 p-5 bg-card hover:border-primary/50 transition duration-300 group">
         <div className="text-sm text-muted-foreground font-semibold mb-2">
            {bundle.title}
         </div>
         <div className="flex items-center gap-2 mb-4">
            <div className="text-foreground font-semibold text-2xl">
               {isYearly ? bundle.priceYearly : bundle.priceMonthly}
            </div>
            <div className="text-[10px] font-bold text-primary bg-primary/20 border border-primary/30 px-1.5 rounded-full h-5 flex items-center">
               {bundle.save} OFF
            </div>
         </div>
         <div className="text-xs text-muted-foreground mb-4">por mês</div>
         <div className="space-y-3 pt-4 border-t border-dashed border-border/50">
            {bundle.features.map((feature) => (
               <Feature
                  key={feature.label}
                  label={feature.label}
                  value={feature.value}
               />
            ))}
         </div>
      </div>
   );
}

export function BetterPricingCards() {
   const [billingPeriod, setBillingPeriod] =
      useState<BillingPeriod>("annually");

   const isYearly = billingPeriod === "annually";

   return (
      <div>
         <div className="flex flex-col items-center mb-12">
            <label className="flex items-center gap-3 cursor-pointer select-none">
               <span
                  className={cn(
                     "font-medium transition-colors",
                     !isYearly ? "text-foreground" : "text-muted-foreground",
                  )}
               >
                  Mensal
               </span>
               <div className="relative">
                  <input
                     checked={isYearly}
                     className="sr-only peer"
                     onChange={(e) =>
                        setBillingPeriod(
                           e.target.checked ? "annually" : "monthly",
                        )
                     }
                     type="checkbox"
                  />
                  <div className="w-14 h-8 bg-muted border border-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-foreground after:rounded-full after:h-6 after:w-6 after:transition-all" />
               </div>
               <span
                  className={cn(
                     "font-medium transition-colors",
                     isYearly ? "text-foreground" : "text-muted-foreground",
                  )}
               >
                  Anual
               </span>
            </label>
            <div className="mt-3 text-sm text-primary">
               Ganhe ~2 meses grátis
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {pricingTiers.map((tier) => {
               const price =
                  billingPeriod === "monthly"
                     ? tier.monthlyPrice
                     : tier.yearlyPrice;
               const isCustom = price === null;
               const isFree = price === 0;
               const monthlyEquivalent = tier.yearlyPrice
                  ? (tier.yearlyPrice / 12).toFixed(2)
                  : null;

               return (
                  <div
                     className={cn(
                        "flex flex-col rounded-lg border bg-gradient-to-b from-card to-background relative overflow-hidden",
                        tier.popular ? "border-border" : "border-border/50",
                     )}
                     key={tier.name}
                  >
                     {tier.popular && (
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                     )}

                     <div className="p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                        <div>
                           <div className="text-foreground font-semibold text-xl flex items-center gap-2">
                              {tier.name}
                              {tier.popular && (
                                 <span className="text-primary bg-primary/10 text-[10px] px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wide">
                                    Mais Popular
                                 </span>
                              )}
                           </div>
                           <div className="text-muted-foreground text-sm mt-1">
                              {tier.description}
                           </div>
                           <div className="mt-2 flex items-end gap-2">
                              <div className="text-foreground font-semibold text-4xl">
                                 {isCustom ? (
                                    "Personalizado"
                                 ) : isFree ? (
                                    "R$0"
                                 ) : (
                                    <>
                                       R$
                                       {billingPeriod === "monthly"
                                          ? tier.monthlyPrice
                                          : monthlyEquivalent}
                                    </>
                                 )}
                              </div>
                              {!isCustom && (
                                 <div className="mb-1 text-sm text-muted-foreground">
                                    {isFree ? "/ mês" : "/ licença / mês"}
                                 </div>
                              )}
                           </div>
                           {billingPeriod === "annually" &&
                              !isFree &&
                              !isCustom && (
                                 <div className="text-primary text-xs mt-1">
                                    Cobrado R${tier.yearlyPrice} anualmente
                                 </div>
                              )}
                        </div>
                        <a
                           className={cn(
                              "font-medium rounded-md flex justify-center items-center h-11 px-6 transition",
                              tier.popular
                                 ? "text-primary-foreground bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                 : "text-foreground border border-border bg-card hover:bg-muted/50",
                           )}
                           href={tier.ctaHref}
                        >
                           {tier.ctaText}
                        </a>
                     </div>

                     <div className="p-6 border-t border-dashed border-border/50 grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <ul className="space-y-3">
                           {tier.features.slice(0, 3).map((feature) => (
                              <li className="flex gap-2" key={feature}>
                                 <IconCheck
                                    className={
                                       tier.popular ? "text-primary" : undefined
                                    }
                                 />
                                 <span
                                    dangerouslySetInnerHTML={{
                                       __html: feature.replace(
                                          /\*\*(.*?)\*\*/g,
                                          "<strong class='text-foreground'>$1</strong>",
                                       ),
                                    }}
                                 />
                              </li>
                           ))}
                        </ul>
                        <ul className="space-y-3">
                           {tier.features.slice(3).map((feature) => (
                              <li className="flex gap-2" key={feature}>
                                 <IconCheck
                                    className={
                                       tier.popular ? "text-primary" : undefined
                                    }
                                 />
                                 <span
                                    dangerouslySetInnerHTML={{
                                       __html: feature.replace(
                                          /\*\*(.*?)\*\*/g,
                                          "<strong class='text-foreground'>$1</strong>",
                                       ),
                                    }}
                                 />
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               );
            })}
         </div>

         <div className="mt-20">
            <div className="flex items-center justify-between mb-8 border-b border-border/50 pb-4">
               <h3 className="text-foreground text-2xl font-semibold">
                  Pacotes de Recursos
               </h3>
               <span className="text-sm text-muted-foreground">
                  Retenção de dados incluída
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {bundles.map((bundle) => (
                  <BundleCard
                     bundle={bundle}
                     isYearly={isYearly}
                     key={bundle.title}
                  />
               ))}
            </div>
         </div>
      </div>
   );
}
