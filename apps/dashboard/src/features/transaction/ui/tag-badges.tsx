import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Link } from "@tanstack/react-router";
import { Tag } from "lucide-react";

type TagBadgesProps = {
   tags: Array<{
      id: string;
      name: string;
      color: string;
   }>;
   asLinks?: boolean;
   slug?: string;
};

export function TagBadges({ tags, asLinks = false, slug }: TagBadgesProps) {
   return (
      <>
         {tags.map((tag) => {
            const announcement = (
               <Announcement
                  className={
                     asLinks
                        ? "cursor-pointer hover:opacity-80 transition-opacity"
                        : undefined
                  }
               >
                  <AnnouncementTag
                     style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                     }}
                  >
                     <Tag className="size-3.5" />
                  </AnnouncementTag>
                  <AnnouncementTitle>{tag.name}</AnnouncementTitle>
               </Announcement>
            );

            if (asLinks && slug) {
               return (
                  <Link
                     key={tag.id}
                     params={{ slug, tagId: tag.id }}
                     to="/$slug/tags/$tagId"
                  >
                     {announcement}
                  </Link>
               );
            }

            return <span key={tag.id}>{announcement}</span>;
         })}
      </>
   );
}
