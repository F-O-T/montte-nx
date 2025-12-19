import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Link } from "@tanstack/react-router";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";

type CategoryAnnouncementProps = {
   category: {
      id?: string;
      name: string;
      color: string;
      icon?: string | null;
   };
   subtitle?: React.ReactNode;
   asLink?: boolean;
   slug?: string;
   categoryId?: string;
};

export function CategoryAnnouncement({
   category,
   subtitle,
   asLink = false,
   slug,
   categoryId,
}: CategoryAnnouncementProps) {
   const content = (
      <Announcement
         className={
            asLink
               ? "cursor-pointer hover:opacity-80 transition-opacity"
               : undefined
         }
      >
         <AnnouncementTag
            style={{
               backgroundColor: `${category.color}20`,
               color: category.color,
            }}
         >
            <IconDisplay
               iconName={(category.icon || "Tag") as IconName}
               size={14}
            />
         </AnnouncementTag>
         <AnnouncementTitle className="max-w-[120px] truncate">
            {category.name}
         </AnnouncementTitle>
         {subtitle && <AnnouncementTitle>{subtitle}</AnnouncementTitle>}
      </Announcement>
   );

   if (asLink && slug && (categoryId || category.id)) {
      return (
         <Link
            params={{ slug, categoryId: categoryId || category.id! }}
            to="/$slug/categories/$categoryId"
         >
            {content}
         </Link>
      );
   }

   return content;
}
