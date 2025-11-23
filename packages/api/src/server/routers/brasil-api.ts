import { getAllBrazilianBanks } from "@packages/brasil-api";
import { publicProcedure } from "../trpc";

export const brasilApiRouter = {
   banks: {
      getAll: publicProcedure.query(async () => {
         try {
            const banks = await getAllBrazilianBanks();
            return banks;
         } catch (error) {
            console.error("Failed to fetch banks:", error);
            throw new Error("Failed to fetch banks list");
         }
      }),
   },
};
