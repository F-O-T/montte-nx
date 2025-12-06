const url = "https://brasilapi.com.br/api";

type Bank = {
   name: string;
   code: string;
   ispb: string;
   fullName: string;
};

type TaxaName = "Selic" | "CDI" | "IPCA";

type Taxa = {
   nome: TaxaName;
   valor: number;
};

export async function getAllBrazilianBanks(): Promise<Bank[]> {
   const response = await fetch(`${url}/banks/v1`);
   const data = await response.json();
   return data as Bank[];
}

export async function getAllTaxas(): Promise<Taxa[]> {
   const response = await fetch(`${url}/taxas/v1`);
   if (!response.ok) {
      throw new Error(`Failed to fetch taxas: ${response.statusText}`);
   }
   const data = await response.json();
   return data as Taxa[];
}

export async function getTaxaByName(nome: TaxaName): Promise<Taxa | null> {
   const taxas = await getAllTaxas();
   return (
      taxas.find((t) => t.nome.toLowerCase() === nome.toLowerCase()) ?? null
   );
}

export type { Bank, Taxa, TaxaName };
