"use client";

import { Button } from "@packages/ui/components/button";
import {
   Tabs,
   TabsContent,
   TabsList,
   TabsTrigger,
} from "@packages/ui/components/tabs";
import { ChartLine, ChevronRight, CreditCard, FileUp, Tag } from "lucide-react";

interface Feature {
   id: string;
   icon: React.ComponentType<{ className?: string }>;
   title: string;
   label: string;
   description: string;
   ctaText: string;
   ctaHref: string;
}

const features: Feature[] = [
   {
      ctaHref: "https://app.montte.co/auth/sign-up",
      ctaText: "Importar agora",
      description:
         "Importe seus extratos bancarios no formato OFX de forma rapida e segura. Compativel com os principais bancos brasileiros. Todas as suas transacoes sao importadas automaticamente e ficam prontas para categorização.",
      icon: FileUp,
      id: "import",
      label: "Importar OFX",
      title: "Importacao de Extratos OFX",
   },
   {
      ctaHref: "https://app.montte.co/auth/sign-up",
      ctaText: "Comecar a categorizar",
      description:
         "Organize suas transacoes com categorias personalizadas. Crie suas proprias categorias ou use as sugeridas pelo sistema. Divida transacoes em multiplas categorias para ter um controle ainda mais preciso.",
      icon: Tag,
      id: "categorize",
      label: "Categorização",
      title: "Categorização Inteligente",
   },
   {
      ctaHref: "https://app.montte.co/auth/sign-up",
      ctaText: "Ver relatorios",
      description:
         "Acompanhe a evolucao das suas financas com graficos e relatorios detalhados. Visualize receitas, despesas e saldo ao longo do tempo. Identifique padroes de gastos e tome decisoes mais conscientes.",
      icon: ChartLine,
      id: "reports",
      label: "Relatorios",
      title: "Relatorios e Analytics",
   },
   {
      ctaHref: "https://app.montte.co/auth/sign-up",
      ctaText: "Adicionar contas",
      description:
         "Gerencie todas as suas contas bancarias em um unico lugar. Conta corrente, poupanca, cartao de credito e investimentos. Tenha uma visao consolidada de todo o seu patrimonio financeiro.",
      icon: CreditCard,
      id: "accounts",
      label: "Multi-contas",
      title: "Gerenciamento de Contas",
   },
];

export function FeaturesTabs() {
   return (
      <Tabs
         className="flex flex-col gap-8 sm:gap-16 lg:gap-24"
         defaultValue="import"
      >
         <div>
            <TabsList className="h-auto max-sm:w-full max-sm:flex-col">
               {features.map((feature) => (
                  <TabsTrigger
                     className="flex items-center gap-1.5 px-3 py-2 max-sm:w-full sm:px-4"
                     key={feature.id}
                     value={feature.id}
                  >
                     <feature.icon className="size-4" />
                     <span className="max-sm:inline">{feature.label}</span>
                  </TabsTrigger>
               ))}
            </TabsList>
         </div>

         {features.map((feature) => (
            <TabsContent key={feature.id} value={feature.id}>
               <div className="flex flex-col items-center justify-between gap-11 lg:flex-row">
                  <div className="flex flex-col gap-4 lg:w-2xl">
                     <div className="flex size-8 items-center justify-center rounded-full border border-primary">
                        <feature.icon className="size-4 text-primary" />
                     </div>
                     <p className="text-sm font-medium uppercase text-primary">
                        {feature.label}
                     </p>
                     <h3 className="text-2xl font-semibold text-card-foreground">
                        {feature.title}
                     </h3>
                     <p className="text-muted-foreground">
                        {feature.description}
                     </p>
                     <a
                        href={feature.ctaHref}
                        rel="noopener noreferrer"
                        target="_blank"
                     >
                        <Button className="group w-fit rounded-full">
                           {feature.ctaText}
                           <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Button>
                     </a>
                  </div>
                  <div className="relative flex items-center justify-center">
                     <FeatureIllustration feature={feature.id} />
                  </div>
               </div>
            </TabsContent>
         ))}
      </Tabs>
   );
}

function FeatureIllustration({ feature }: { feature: string }) {
   switch (feature) {
      case "import":
         return (
            <div className="relative w-full max-w-md">
               <div className="rounded-xl border bg-card p-6 shadow-lg">
                  <div className="mb-4 flex items-center gap-3">
                     <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileUp className="size-5 text-primary" />
                     </div>
                     <div>
                        <p className="font-medium">Importar Extrato</p>
                        <p className="text-sm text-muted-foreground">
                           Formato OFX
                        </p>
                     </div>
                  </div>
                  <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                     <FileUp className="mx-auto mb-3 size-8 text-primary/50" />
                     <p className="text-sm text-muted-foreground">
                        Arraste seu arquivo OFX aqui
                     </p>
                     <p className="mt-1 text-xs text-muted-foreground">
                        ou clique para selecionar
                     </p>
                  </div>
                  <div className="mt-4 space-y-2">
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                           Bancos suportados:
                        </span>
                        <span className="font-medium">50+</span>
                     </div>
                     <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Formato:</span>
                        <span className="font-medium">OFX / QFX</span>
                     </div>
                  </div>
               </div>
            </div>
         );
      case "categorize":
         return (
            <div className="relative w-full max-w-md">
               <div className="rounded-xl border bg-card p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                     <p className="font-medium">Categorias</p>
                     <Button size="sm" variant="outline">
                        + Nova
                     </Button>
                  </div>
                  <div className="space-y-3">
                     {[
                        {
                           color: "bg-red-500",
                           name: "Alimentacao",
                           percent: 35,
                        },
                        {
                           color: "bg-blue-500",
                           name: "Transporte",
                           percent: 20,
                        },
                        { color: "bg-green-500", name: "Lazer", percent: 15 },
                        { color: "bg-yellow-500", name: "Saude", percent: 10 },
                        {
                           color: "bg-purple-500",
                           name: "Educacao",
                           percent: 20,
                        },
                     ].map((cat) => (
                        <div className="flex items-center gap-3" key={cat.name}>
                           <div
                              className={`size-3 rounded-full ${cat.color}`}
                           />
                           <span className="flex-1 text-sm">{cat.name}</span>
                           <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                 className={`h-full ${cat.color}`}
                                 style={{ width: `${cat.percent}%` }}
                              />
                           </div>
                           <span className="w-10 text-right text-sm text-muted-foreground">
                              {cat.percent}%
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         );
      case "reports":
         return (
            <div className="relative w-full max-w-md">
               <div className="rounded-xl border bg-card p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                     <p className="font-medium">Evolução Mensal</p>
                     <span className="text-sm text-muted-foreground">2024</span>
                  </div>
                  <div className="flex h-40 items-end justify-between gap-2">
                     {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map(
                        (height, i) => (
                           <div
                              className="flex-1 rounded-t bg-primary/20 transition-all hover:bg-primary/40"
                              key={`bar-${i}`}
                              style={{ height: `${height}%` }}
                           />
                        ),
                     )}
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                     <span>Jan</span>
                     <span>Jun</span>
                     <span>Dez</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                     <div>
                        <p className="text-sm text-muted-foreground">
                           Total Receitas
                        </p>
                        <p className="text-lg font-semibold text-primary">
                           R$ 45.230
                        </p>
                     </div>
                     <div>
                        <p className="text-sm text-muted-foreground">
                           Total Despesas
                        </p>
                        <p className="text-lg font-semibold text-destructive">
                           R$ 32.180
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         );
      case "accounts":
         return (
            <div className="relative w-full max-w-md">
               <div className="rounded-xl border bg-card p-6 shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                     <p className="font-medium">Minhas Contas</p>
                     <Button size="sm" variant="outline">
                        + Adicionar
                     </Button>
                  </div>
                  <div className="space-y-3">
                     {[
                        {
                           balance: "R$ 5.430",
                           bank: "Banco do Brasil",
                           type: "Corrente",
                        },
                        {
                           balance: "R$ 12.800",
                           bank: "Nubank",
                           type: "Poupanca",
                        },
                        { balance: "-R$ 1.200", bank: "Itau", type: "Cartao" },
                        {
                           balance: "R$ 8.500",
                           bank: "XP",
                           type: "Investimentos",
                        },
                     ].map((account) => (
                        <div
                           className="flex items-center justify-between rounded-lg border p-3"
                           key={account.bank}
                        >
                           <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                                 <CreditCard className="size-5 text-primary" />
                              </div>
                              <div>
                                 <p className="text-sm font-medium">
                                    {account.bank}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                    {account.type}
                                 </p>
                              </div>
                           </div>
                           <p
                              className={`font-medium ${account.balance.startsWith("-") ? "text-destructive" : "text-foreground"}`}
                           >
                              {account.balance}
                           </p>
                        </div>
                     ))}
                  </div>
                  <div className="mt-4 border-t pt-4">
                     <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                           Saldo Total
                        </span>
                        <span className="text-xl font-semibold text-primary">
                           R$ 25.530
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         );
      default:
         return null;
   }
}
