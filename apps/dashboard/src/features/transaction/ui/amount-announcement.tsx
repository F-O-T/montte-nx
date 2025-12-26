import { formatDecimalCurrency } from "@packages/money";
import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { TrendingDown, TrendingUp } from "lucide-react";

type AmountAnnouncementProps = {
   amount: number;
   isPositive: boolean;
};

export function AmountAnnouncement({
   amount,
   isPositive,
}: AmountAnnouncementProps) {
   const Icon = isPositive ? TrendingUp : TrendingDown;
   const formattedAmount = formatDecimalCurrency(Math.abs(amount));

   const color = isPositive ? "#10b981" : "#ef4444";

   return (
      <Announcement>
         <AnnouncementTag
            style={{
               backgroundColor: `${color}20`,
               color,
            }}
         >
            <Icon className="size-3.5" />
         </AnnouncementTag>
         <AnnouncementTitle style={{ color }}>
            {isPositive ? "+" : "-"}
            {formattedAmount}
         </AnnouncementTitle>
      </Announcement>
   );
}
