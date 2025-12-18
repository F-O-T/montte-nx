import {
	Announcement,
	AnnouncementTag,
	AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { getAccountTypeIcon } from "../lib/account-icon";

type BankAccountAnnouncementProps = {
	bankAccount: {
		name: string | null;
		type?: string | null;
		bank?: string | null;
	};
	showLabel?: boolean;
};

export function BankAccountAnnouncement({
	bankAccount,
	showLabel = true,
}: BankAccountAnnouncementProps) {
	const AccountIcon = getAccountTypeIcon(bankAccount.type);

	return (
		<Announcement>
			<AnnouncementTag className="flex items-center gap-1.5">
				<AccountIcon className="size-3.5" />
				{showLabel ? "Conta" : bankAccount.name}
			</AnnouncementTag>
			{showLabel ? (
				<AnnouncementTitle>{bankAccount.name}</AnnouncementTitle>
			) : (
				bankAccount.bank && (
					<AnnouncementTitle>{bankAccount.bank}</AnnouncementTitle>
				)
			)}
		</Announcement>
	);
}
