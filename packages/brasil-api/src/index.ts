const url = "https://brasilapi.com.br/api";
type Bank = {
   name: string;
   code: string;
   ispb: string;
   fullName: string;
};
export async function getAllBrazilianBanks(): Promise<Bank[]> {
   const response = await fetch(`${url}/banks/v1`);
   const data = await response.json();
   return data as Bank[];
}
