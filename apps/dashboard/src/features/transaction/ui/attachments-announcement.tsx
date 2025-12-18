import {
	Announcement,
	AnnouncementTag,
	AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Paperclip } from "lucide-react";

type AttachmentsAnnouncementProps = {
	count: number;
};

export function AttachmentsAnnouncement({
	count,
}: AttachmentsAnnouncementProps) {
	return (
		<Announcement>
			<AnnouncementTag className="flex items-center gap-1.5">
				<Paperclip className="size-3.5" />
				Anexos
			</AnnouncementTag>
			<AnnouncementTitle>
				{count} {count === 1 ? "arquivo" : "arquivos"}
			</AnnouncementTitle>
		</Announcement>
	);
}
