import {
	Announcement,
	AnnouncementTag,
	AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Link } from "@tanstack/react-router";

type CostCenterAnnouncementProps = {
	costCenter: {
		id: string;
		name: string;
		code?: string | null;
	};
	asLink?: boolean;
	slug?: string;
};

export function CostCenterAnnouncement({
	costCenter,
	asLink = false,
	slug,
}: CostCenterAnnouncementProps) {
	const content = (
		<Announcement
			className={
				asLink ? "cursor-pointer hover:opacity-80 transition-opacity" : undefined
			}
		>
			<AnnouncementTag>{costCenter.code || "Centro de Custo"}</AnnouncementTag>
			<AnnouncementTitle>{costCenter.name}</AnnouncementTitle>
		</Announcement>
	);

	if (asLink && slug) {
		return (
			<Link
				params={{ slug, costCenterId: costCenter.id }}
				to="/$slug/cost-centers/$costCenterId"
			>
				{content}
			</Link>
		);
	}

	return content;
}
