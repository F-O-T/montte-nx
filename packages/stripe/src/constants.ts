export enum PlanName {
	FREE = "free",
	BASIC = "basic",
	ERP = "erp",
}

export const STRIPE_PLANS = [
	{
		annualPrice: null,
		description: "Para começar a organizar suas finanças",
		displayName: "Free",
		features: [
			"1 usuário",
			"Categorias básicas",
			"Transações ilimitadas",
			"Relatórios básicos",
			"Importação OFX/CSV",
			"Exportação OFX/CSV/PDF",
		],
		name: PlanName.FREE,
		price: "R$ 0",
	},
	{
		annualPrice: "R$ 150",
		description: "Para finanças pessoais",
		displayName: "Pessoal",
		features: [
			"1 usuário",
			"Categorias",
			"Tags",
			"Transações ilimitadas",
			"Mais opções de relatórios",
			"Importação OFX/CSV",
			"Exportação OFX/CSV/PDF",
			"Suporte por email",
			"14 dias de teste grátis",
		],
		name: PlanName.BASIC,
		price: "R$ 15",
	},
	{
		annualPrice: "R$ 1500",
		description: "Para equipes e empresas em crescimento",
		displayName: "ERP",
		features: [
			"Membros ilimitados",
			"Todas as funcionalidades",
			"Centros de custo",
			"Modelos de juros",
			"Automações",
			"Relatórios avançados",
			"Suporte prioritário",
			"Chamada 1:1 para configurar automações",
			"API access",
			"7 dias de teste grátis",
		],
		highlighted: true,
		name: PlanName.ERP,
		price: "R$ 150",
	},
];

export const STRIPE_ADDONS = {
	sharedFinances: {
		name: "shared-finances",
		displayName: "Finanças Compartilhadas",
		description: "Convide uma pessoa para gerenciar suas finanças juntos",
		price: "R$ 10",
		annualPrice: "R$ 100",
		features: [
			"Convide 1 pessoa adicional",
			"Ideal para casais e noivos",
			"Acesso compartilhado às finanças",
		],
		availableFor: [PlanName.BASIC],
	},
};
