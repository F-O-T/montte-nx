import { Avatar, AvatarFallback, AvatarImage } from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Field,
	FieldGroup,
	FieldLabel,
} from "@packages/ui/components/field";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemSeparator,
	ItemTitle,
} from "@packages/ui/components/item";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import {
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@packages/ui/components/sheet";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Shield, ShieldCheck, ShieldPlus, Trash2, Users } from "lucide-react";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useGrantPermission } from "@/features/permissions/hooks/use-grant-permission";
import { useRevokePermission } from "@/features/permissions/hooks/use-revoke-permission";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

interface BankAccountPermissionsSheetProps {
	bankAccountId: string;
	bankAccountName: string;
}

type PermissionLevel = "view" | "edit" | "manage";

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
	view: "Visualizar",
	edit: "Editar",
	manage: "Gerenciar",
};

const PERMISSION_DESCRIPTIONS: Record<PermissionLevel, string> = {
	view: "Pode visualizar a conta e transações",
	edit: "Pode editar e importar transações",
	manage: "Pode excluir a conta",
};

function PermissionBadge({ permission }: { permission: PermissionLevel }) {
	const variants: Record<PermissionLevel, "default" | "secondary" | "outline"> = {
		view: "outline",
		edit: "secondary",
		manage: "default",
	};

	return (
		<Badge variant={variants[permission]}>
			{PERMISSION_LABELS[permission]}
		</Badge>
	);
}

function PermissionsListContent({
	bankAccountId,
}: {
	bankAccountId: string;
}) {
	const trpc = useTRPC();
	const { revokePermission, isPending: isRevoking } = useRevokePermission();

	const { data } = useSuspenseQuery(
		trpc.permissions.getForResource.queryOptions({
			resourceType: "bank_account",
			resourceId: bankAccountId,
		}),
	);

	const handleRevoke = async (
		granteeType: "user" | "team",
		granteeId: string,
	) => {
		await revokePermission({
			resourceType: "bank_account",
			resourceId: bankAccountId,
			granteeType,
			granteeId,
		});
	};

	if (data.permissions.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				<Shield className="size-12 mx-auto mb-3 opacity-50" />
				<p className="text-sm">Nenhuma permissão configurada</p>
				<p className="text-xs mt-1">
					Adicione usuários ou equipes para compartilhar esta conta
				</p>
			</div>
		);
	}

	return (
		<ItemGroup>
			{data.permissions.map((permission, index) => (
				<Fragment key={permission.id}>
					<Item>
						<ItemMedia className="size-10">
							{permission.granteeType === "user" ? (
								<Avatar>
									{permission.granteeImage && (
										<AvatarImage src={permission.granteeImage} />
									)}
									<AvatarFallback>
										{getInitials(permission.granteeName || "?")}
									</AvatarFallback>
								</Avatar>
							) : (
								<div className="size-10 rounded-full bg-muted flex items-center justify-center">
									<Users className="size-5 text-muted-foreground" />
								</div>
							)}
						</ItemMedia>
						<ItemContent>
							<ItemTitle className="truncate">
								{permission.granteeName || "Desconhecido"}
							</ItemTitle>
							<ItemDescription>
								{permission.granteeType === "user" ? "Usuário" : "Equipe"}
							</ItemDescription>
						</ItemContent>
						<ItemActions className="flex items-center gap-2">
							<PermissionBadge
								permission={permission.permission as PermissionLevel}
							/>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 text-destructive hover:text-destructive"
								onClick={() =>
									handleRevoke(permission.granteeType, permission.granteeId)
								}
								disabled={isRevoking}
							>
								<Trash2 className="size-4" />
							</Button>
						</ItemActions>
					</Item>
					{index !== data.permissions.length - 1 && <ItemSeparator />}
				</Fragment>
			))}
		</ItemGroup>
	);
}

function PermissionsListSkeleton() {
	return (
		<ItemGroup>
			{[1, 2, 3].map((index) => (
				<Fragment key={`skeleton-${index}`}>
					<Item>
						<ItemMedia className="size-10">
							<Skeleton className="size-10 rounded-full" />
						</ItemMedia>
						<ItemContent className="gap-1">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-20" />
						</ItemContent>
						<ItemActions>
							<Skeleton className="h-6 w-16" />
						</ItemActions>
					</Item>
					{index !== 3 && <ItemSeparator />}
				</Fragment>
			))}
		</ItemGroup>
	);
}

function AddPermissionForm({ bankAccountId }: { bankAccountId: string }) {
	const trpc = useTRPC();
	const { grantPermission, isPending } = useGrantPermission();
	const [selectedUserId, setSelectedUserId] = useState<string>("");
	const [selectedPermission, setSelectedPermission] =
		useState<PermissionLevel>("view");

	const { data: membersData } = useSuspenseQuery(
		trpc.organization.getActiveOrganizationMembers.queryOptions(),
	);

	const handleGrant = async () => {
		if (!selectedUserId) return;

		await grantPermission({
			resourceType: "bank_account",
			resourceId: bankAccountId,
			granteeType: "user",
			granteeId: selectedUserId,
			permission: selectedPermission,
		});

		setSelectedUserId("");
		setSelectedPermission("view");
	};

	return (
		<div className="space-y-4 rounded-lg border bg-muted/30 p-4">
			<div className="flex items-center gap-2 text-sm font-medium">
				<ShieldPlus className="size-4" />
				Adicionar permissão
			</div>

			<div className="grid gap-3">
				<FieldGroup>
					<Field>
						<FieldLabel>Usuário</FieldLabel>
						<Select value={selectedUserId} onValueChange={setSelectedUserId}>
							<SelectTrigger>
								<SelectValue placeholder="Selecione um usuário" />
							</SelectTrigger>
							<SelectContent>
								{membersData.map((member) => (
									<SelectItem key={member.user.id} value={member.user.id}>
										<div className="flex items-center gap-2">
											<Avatar className="size-5">
												{member.user.image && (
													<AvatarImage src={member.user.image} />
												)}
												<AvatarFallback className="text-xs">
													{getInitials(member.user.name)}
												</AvatarFallback>
											</Avatar>
											<span>{member.user.name}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>

				<FieldGroup>
					<Field>
						<FieldLabel>Nível de permissão</FieldLabel>
						<Select
							value={selectedPermission}
							onValueChange={(value) =>
								setSelectedPermission(value as PermissionLevel)
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="view">
									<div className="flex flex-col items-start">
										<span>Visualizar</span>
										<span className="text-xs text-muted-foreground">
											{PERMISSION_DESCRIPTIONS.view}
										</span>
									</div>
								</SelectItem>
								<SelectItem value="edit">
									<div className="flex flex-col items-start">
										<span>Editar</span>
										<span className="text-xs text-muted-foreground">
											{PERMISSION_DESCRIPTIONS.edit}
										</span>
									</div>
								</SelectItem>
								<SelectItem value="manage">
									<div className="flex flex-col items-start">
										<span>Gerenciar</span>
										<span className="text-xs text-muted-foreground">
											{PERMISSION_DESCRIPTIONS.manage}
										</span>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>

				<Button
					onClick={handleGrant}
					disabled={!selectedUserId || isPending}
					className="w-full"
				>
					<ShieldCheck className="size-4 mr-2" />
					Conceder permissão
				</Button>
			</div>
		</div>
	);
}

function AddPermissionFormSkeleton() {
	return (
		<div className="space-y-4 rounded-lg border bg-muted/30 p-4">
			<Skeleton className="h-5 w-40" />
			<div className="grid gap-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-10 w-full" />
			</div>
		</div>
	);
}

export function BankAccountPermissionsSheet({
	bankAccountId,
	bankAccountName,
}: BankAccountPermissionsSheetProps) {
	const { closeSheet } = useSheet();

	return (
		<div className="h-full flex flex-col">
			<SheetHeader>
				<SheetTitle className="flex items-center gap-2">
					<Shield className="size-5" />
					Gerenciar acessos
				</SheetTitle>
				<SheetDescription>
					Controle quem pode acessar a conta "{bankAccountName}"
				</SheetDescription>
			</SheetHeader>

			<div className="flex-1 overflow-y-auto px-4 space-y-6">
				{/* Add Permission Form */}
				<ErrorBoundary
					fallback={
						<div className="text-sm text-destructive">
							Erro ao carregar formulário
						</div>
					}
				>
					<Suspense fallback={<AddPermissionFormSkeleton />}>
						<AddPermissionForm bankAccountId={bankAccountId} />
					</Suspense>
				</ErrorBoundary>

				{/* Current Permissions */}
				<div className="space-y-3">
					<h3 className="text-sm font-medium flex items-center gap-2">
						<Users className="size-4" />
						Permissões atuais
					</h3>
					<ErrorBoundary
						fallback={
							<div className="text-sm text-destructive">
								Erro ao carregar permissões
							</div>
						}
					>
						<Suspense fallback={<PermissionsListSkeleton />}>
							<PermissionsListContent bankAccountId={bankAccountId} />
						</Suspense>
					</ErrorBoundary>
				</div>
			</div>

			<SheetFooter>
				<Button variant="outline" onClick={closeSheet} className="w-full">
					Fechar
				</Button>
			</SheetFooter>
		</div>
	);
}
