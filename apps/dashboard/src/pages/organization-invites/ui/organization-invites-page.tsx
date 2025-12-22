import { translate } from "@packages/localization";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
	InvitesDataTable,
	InvitesDataTableSkeleton,
} from "@/features/organization-invites/ui/invites-data-table";
import { useInviteMember } from "@/features/organization-invites/hooks/use-invite-member";
import { useRevokeInvitation } from "@/features/organization-invites/hooks/use-revoke-invitation";
import { useTRPC } from "@/integrations/clients";
import { InvitesQuickActionsToolbar } from "./organization-invites-quick-actions-toolbar";

function InvitesPageContent() {
	const trpc = useTRPC();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [roleFilter, setRoleFilter] = useState("all");
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	const { data: invitesData } = useSuspenseQuery(
		trpc.organizationInvites.listInvitations.queryOptions({
			limit: pageSize,
			offset: (currentPage - 1) * pageSize,
		}),
	);

	const { inviteMember } = useInviteMember();
	const { revokeInvitation } = useRevokeInvitation();

	const handleResend = (invite: (typeof invitesData.invitations)[number]) => {
		inviteMember({
			email: invite.email,
			role: invite.role.toLowerCase() as "member" | "admin" | "owner",
		});
	};

	const handleRevoke = (inviteId: string) => {
		revokeInvitation(inviteId);
	};

	const handleBulkResend = (inviteIds: string[]) => {
		const invites = invitesData.invitations.filter((inv) =>
			inviteIds.includes(inv.id),
		);
		for (const invite of invites) {
			inviteMember({
				email: invite.email,
				role: invite.role.toLowerCase() as "member" | "admin" | "owner",
			});
		}
	};

	const handleBulkRevoke = (inviteIds: string[]) => {
		for (const id of inviteIds) {
			revokeInvitation(id);
		}
	};

	const hasActiveFilters = statusFilter !== "all" || roleFilter !== "all";

	const handleClearFilters = () => {
		setStatusFilter("all");
		setRoleFilter("all");
	};

	const totalPages = Math.ceil(invitesData.total / pageSize);

	return (
		<InvitesDataTable
			filters={{
				hasActiveFilters,
				onClearFilters: handleClearFilters,
				onRoleFilterChange: setRoleFilter,
				onSearchChange: setSearchTerm,
				onStatusFilterChange: setStatusFilter,
				roleFilter,
				searchTerm,
				statusFilter,
			}}
			invites={invitesData.invitations}
			onBulkResend={handleBulkResend}
			onBulkRevoke={handleBulkRevoke}
			onResend={handleResend}
			onRevoke={handleRevoke}
			pagination={{
				currentPage,
				onPageChange: setCurrentPage,
				pageSize,
				totalCount: invitesData.total,
				totalPages,
			}}
		/>
	);
}

function InvitesPageError({ error }: { error: Error }) {
	return (
		<div className="text-center py-8">
			<p className="text-muted-foreground">
				{translate("common.errors.default")}
			</p>
			<p className="text-xs text-muted-foreground mt-1">{error.message}</p>
		</div>
	);
}

export function OrganizationInvitesPage() {
	return (
		<main className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">
						{translate("dashboard.routes.organization.invites-table.title")}
					</h1>
					<p className="text-muted-foreground">
						{translate(
							"dashboard.routes.organization.invites-table.description",
						)}
					</p>
				</div>
				<InvitesQuickActionsToolbar />
			</div>

			<ErrorBoundary FallbackComponent={InvitesPageError}>
				<Suspense fallback={<InvitesDataTableSkeleton />}>
					<InvitesPageContent />
				</Suspense>
			</ErrorBoundary>
		</main>
	);
}
