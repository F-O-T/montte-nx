import { getAllBrazilianBanks } from "@packages/brasil-api";
import { TTL } from "@packages/cache/client";
import { publicProcedure, withCache } from "../trpc";

export const brasilApiRouter = {
   banks: {
      getAll: publicProcedure.query(
         withCache("brasil-api:banks", getAllBrazilianBanks, TTL.LONG),
      ),
   },
};
