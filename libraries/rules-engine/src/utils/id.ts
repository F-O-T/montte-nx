export const generateId = (): string => {
   if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
   }
   return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
};
