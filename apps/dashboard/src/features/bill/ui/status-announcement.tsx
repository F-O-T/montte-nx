import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { type BillStatus, getStatusConfig } from "../lib/bill-status";

type StatusAnnouncementProps = {
   status: BillStatus;
   subtitle?: React.ReactNode;
};

export function StatusAnnouncement({
   status,
   subtitle,
}: StatusAnnouncementProps) {
   const config = getStatusConfig(status);
   const Icon = config.icon;

   const statusColors = {
      paid: { bg: "#10b98120", text: "#10b981" },
      overdue: { bg: "#ef444420", text: "#ef4444" },
      pending: { bg: "#eab30820", text: "#eab308" },
   };

   return (
      <Announcement>
         <AnnouncementTag
            style={{
               backgroundColor: statusColors[status].bg,
               color: statusColors[status].text,
            }}
         >
            <Icon className="size-3.5" />
         </AnnouncementTag>
         <AnnouncementTitle>{config.label}</AnnouncementTitle>
         {subtitle && <AnnouncementTitle>{subtitle}</AnnouncementTitle>}
      </Announcement>
   );
}
