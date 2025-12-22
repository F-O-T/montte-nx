import { Landmark, PiggyBank, TrendingUp } from "lucide-react";

export function getAccountTypeIcon(type: string | null | undefined) {
   switch (type) {
      case "savings":
         return PiggyBank;
      case "investment":
         return TrendingUp;
      default:
         return Landmark;
   }
}
