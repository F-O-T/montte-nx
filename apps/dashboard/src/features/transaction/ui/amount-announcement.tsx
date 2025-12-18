import {
	Announcement,
	AnnouncementTag,
	AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { formatDecimalCurrency } from "@packages/utils/money";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

type AmountAnnouncementProps = {
	amount: number;
	isPositive: boolean;
};

export function AmountAnnouncement({
	amount,
	isPositive,
}: AmountAnnouncementProps) {
	const Icon = isPositive ? ArrowDownLeft : ArrowUpRight;
	const formattedAmount = formatDecimalCurrency(Math.abs(amount));

	return (
		<Announcement>
			<AnnouncementTag
				style={{
					backgroundColor: isPositive ? "#10b98120" : "#ef444420",
					color: isPositive ? "#10b981" : "#ef4444",
				}}
			>
				<Icon className="size-3.5" />
			</AnnouncementTag>
			<AnnouncementTitle>
				{isPositive ? "+" : "-"}
				{formattedAmount}
			</AnnouncementTitle>
		</Announcement>
	);
}
