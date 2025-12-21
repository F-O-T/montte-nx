import type { Taxa } from "@packages/brasil-api";
import type { InterestRates } from "@packages/utils/interest";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTRPC } from "@/integrations/clients";

const FALLBACK_RATES: InterestRates = {
   cdi: 13.15,
   ipca: 4.5,
   selic: 13.25,
};

export function useInterestRates() {
   const trpc = useTRPC();

   const query = useSuspenseQuery(trpc.brasilApi.taxas.getAll.queryOptions());

   const rates = useMemo<InterestRates>(() => {
      if (!query.data || query.isError) {
         return FALLBACK_RATES;
      }

      const taxas = query.data;

      const selic = taxas.find((t: Taxa) => t.nome.toLowerCase() === "selic");
      const ipca = taxas.find((t: Taxa) => t.nome.toLowerCase() === "ipca");
      const cdi = taxas.find((t: Taxa) => t.nome.toLowerCase() === "cdi");

      if (!selic || !ipca || !cdi) {
         console.warn("[useInterestRates] Missing rate data, using fallback", {
            hasSelic: !!selic,
            hasIpca: !!ipca,
            hasCdi: !!cdi,
         });
         return FALLBACK_RATES;
      }

      if (
         selic.valor <= 0 ||
         ipca.valor <= 0 ||
         cdi.valor <= 0 ||
         Number.isNaN(selic.valor) ||
         Number.isNaN(ipca.valor) ||
         Number.isNaN(cdi.valor)
      ) {
         console.warn(
            "[useInterestRates] Invalid rate values, using fallback",
            { selic: selic.valor, ipca: ipca.valor, cdi: cdi.valor },
         );
         return FALLBACK_RATES;
      }

      return {
         cdi: cdi.valor,
         ipca: ipca.valor,
         selic: selic.valor,
      };
   }, [query.data, query.isError]);

   return {
      rates,
      isError: query.isError,
      isFallback: !query.data || query.isError,
   };
}
