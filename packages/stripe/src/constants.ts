export enum PlanName {
   BASIC = "basic",
   PRO = "pro",
}

export const STRIPE_PLANS = [
   {
      annualPrice: "R$ 290",
      description: "Para pequenos negócios e uso pessoal",
      displayName: "Basic",
      features: [
         "Até 3 membros",
         "1.000 transações/mês",
         "Relatórios básicos",
         "Suporte por email",
         "Exportação OFX",
      ],

      name: PlanName.BASIC,
      price: "R$ 29",
   },
   {
      annualPrice: "R$ 790",
      description: "Para equipes em crescimento",
      displayName: "Pro",
      features: [
         "Até 10 membros",
         "10.000 transações/mês",
         "Relatórios avançados",
         "Suporte prioritário",
         "API access",
         "14 dias de teste grátis",
      ],
      highlighted: true,
      name: PlanName.PRO,
      price: "R$ 79",
   },
];
