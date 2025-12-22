export const hashContext = (context: unknown): string => {
   const str = JSON.stringify(context, (_, value) => {
      if (value instanceof Date) {
         return value.toISOString();
      }
      if (value instanceof Map) {
         return Object.fromEntries(value);
      }
      if (value instanceof Set) {
         return Array.from(value);
      }
      return value;
   });

   if (typeof Bun !== "undefined" && Bun.hash) {
      return Bun.hash(str).toString(16);
   }

   let hash = 0;
   for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
   }
   return Math.abs(hash).toString(16);
};

export const hashRules = (ruleIds: ReadonlyArray<string>): string => {
   return hashContext(ruleIds.slice().sort());
};
