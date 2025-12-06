import { useCallback } from "react";

const STORAGE_KEY = "montte:pending-ofx-import";

type PendingOfxImport = {
   content: string;
   filename: string;
   timestamp: number;
};

export function usePendingOfxImport() {
   const getPending = useCallback((): PendingOfxImport | null => {
      try {
         const data = sessionStorage.getItem(STORAGE_KEY);
         if (!data) return null;

         const parsed = JSON.parse(data) as PendingOfxImport;
         if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
         }
         return parsed;
      } catch {
         return null;
      }
   }, []);

   const setPending = useCallback((content: string, filename: string) => {
      try {
         sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ content, filename, timestamp: Date.now() }),
         );
      } catch {
         // sessionStorage not available
      }
   }, []);

   const clearPending = useCallback(() => {
      try {
         sessionStorage.removeItem(STORAGE_KEY);
      } catch {
         // sessionStorage not available
      }
   }, []);

   return { clearPending, getPending, setPending };
}
