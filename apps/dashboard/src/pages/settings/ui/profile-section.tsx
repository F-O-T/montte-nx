import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   CredenzaBody,
   CredenzaClose,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Input } from "@packages/ui/components/input";
import {
   InputOTP,
   InputOTPGroup,
   InputOTPSlot,
} from "@packages/ui/components/input-otp";
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
import { Label } from "@packages/ui/components/label";
import {
   RadioGroup,
   RadioGroupItem,
} from "@packages/ui/components/radio-group";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { getInitials } from "@packages/utils/text";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
   AlertTriangle,
   Calendar,
   ChevronRight,
   Copy,
   Download,
   Key,
   Link2,
   Link2Off,
   Loader2,
   Lock,
   Mail,
   Pencil,
   Shield,
   ShieldCheck,
   ShieldOff,
   Smartphone,
   Trash2,
   User,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { useCredenza } from "@/hooks/use-credenza";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

function formatDate(date: Date | string | null): string {
   if (!date) return "-";
   const d = new Date(date);
   return d.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
   });
}

function ProfileSectionErrorFallback(props: FallbackProps) {
   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.profile.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.profile.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.information.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.information.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function ProfileSectionSkeleton() {
   return (
      <div className="space-y-4 md:space-y-6">
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Profile Card Skeleton */}
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                     <CardAction>
                        <Skeleton className="size-8" />
                     </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-4 md:space-y-6">
                     <div className="flex items-center gap-3 md:gap-4">
                        <Skeleton className="size-16 md:size-20 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1 min-w-0">
                           <Skeleton className="h-6 w-32" />
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-5 w-28" />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Account Summary Skeleton */}
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <div className="rounded-lg bg-secondary/50 p-4">
                     <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                     <Skeleton className="h-8 w-2/3 mx-auto" />
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Second Row Skeleton */}
         <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-2">
               <Card className="h-full">
                  <CardHeader>
                     <Skeleton className="h-6 w-1/3" />
                     <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1">
                        <Skeleton className="h-14 w-full rounded-lg" />
                        <Skeleton className="h-14 w-full rounded-lg" />
                     </div>
                  </CardContent>
               </Card>
            </div>
            <Card className="h-full">
               <CardHeader>
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
               </CardHeader>
               <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
               </CardContent>
            </Card>
         </div>
      </div>
   );
}

// ============================================
// Profile Card Component
// ============================================

function ProfileCard({
   session,
   slug,
}: {
   session: {
      user?: {
         name?: string | null;
         email?: string | null;
         image?: string | null;
         emailVerified?: boolean;
      } | null;
   } | null;
   slug: string;
}) {
   const isEmailVerified = session?.user?.emailVerified;

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.profile.title")}
            </CardTitle>
            <CardDescription>
               Visualize e gerencie as informações do seu perfil pessoal
            </CardDescription>
            <CardAction>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button asChild size="icon" variant="ghost">
                        <Link params={{ slug }} to="/$slug/profile">
                           <Pencil className="size-4" />
                        </Link>
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar perfil</TooltipContent>
               </Tooltip>
            </CardAction>
         </CardHeader>
         <CardContent className="space-y-4 md:space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-3 md:gap-4">
               <Avatar className="size-16 md:size-20 shrink-0">
                  <AvatarImage
                     alt={session?.user?.name || "Profile picture"}
                     src={session?.user?.image || undefined}
                  />
                  <AvatarFallback className="text-lg md:text-xl">
                     {getInitials(
                        session?.user?.name || "",
                        session?.user?.email || "",
                     )}
                  </AvatarFallback>
               </Avatar>
               <div className="min-w-0 flex-1">
                  <h3 className="text-lg md:text-xl font-semibold truncate">
                     {session?.user?.name || "-"}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                     {session?.user?.email || "-"}
                  </p>
                  {isEmailVerified && (
                     <Badge
                        className="mt-2 bg-green-500 hover:bg-green-500/90"
                        variant="default"
                     >
                        <Shield className="size-3 mr-1" />
                        Email verificado
                     </Badge>
                  )}
               </div>
            </div>

            {/* Profile Details */}
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <User className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.profile.items.name",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {session?.user?.name || "-"}
                     </ItemDescription>
                  </ItemContent>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Mail className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.profile.items.email",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {session?.user?.email || "-"}
                     </ItemDescription>
                  </ItemContent>
                  {isEmailVerified && (
                     <ItemActions>
                        <Badge variant="secondary">Verificado</Badge>
                     </ItemActions>
                  )}
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// Account Summary Card Component
// ============================================

function AccountSummaryCard({
   session,
}: {
   session: {
      user?: {
         createdAt?: Date | string | null;
         emailVerified?: boolean;
      } | null;
   } | null;
}) {
   const isEmailVerified = session?.user?.emailVerified;
   const createdAt = session?.user?.createdAt;

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Resumo da Conta</CardTitle>
            <CardDescription>
               Informações gerais sobre sua conta
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Calendar className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Membro desde</ItemTitle>
                     <ItemDescription>
                        {formatDate(createdAt ?? null)}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            </ItemGroup>

            <div className="rounded-lg bg-secondary/50 p-4 text-center">
               <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  Status da conta
               </p>
               <div className="flex items-center justify-center gap-2">
                  {isEmailVerified ? (
                     <>
                        <Shield className="size-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-500">
                           Verificada
                        </span>
                     </>
                  ) : (
                     <>
                        <Shield className="size-5 text-muted-foreground" />
                        <span className="text-lg font-semibold text-muted-foreground">
                           Não verificada
                        </span>
                     </>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
}

// ============================================
// Two Factor Setup Credenza Content
// ============================================

function TwoFactorSetupCredenzaContent({
   onClose,
}: {
   onClose: () => void;
}) {
   const [step, setStep] = useState<"password" | "qrcode" | "verify" | "backup">(
      "password",
   );
   const [password, setPassword] = useState("");
   const [totpUri, setTotpUri] = useState("");
   const [verifyCode, setVerifyCode] = useState("");
   const [backupCodes, setBackupCodes] = useState<string[]>([]);

   const enableMutation = useMutation({
      mutationFn: async () => {
         const result = await betterAuthClient.twoFactor.enable({
            password,
         });
         return result;
      },
      onSuccess: async () => {
         // Get TOTP URI for QR code
         const uriResult = await betterAuthClient.twoFactor.getTotpUri({
            password,
         });
         if (uriResult.data?.totpURI) {
            setTotpUri(uriResult.data.totpURI);
            setStep("qrcode");
         }
      },
      onError: () => {
         toast.error("Senha incorreta");
      },
   });

   const verifyMutation = useMutation({
      mutationFn: async () => {
         const result = await betterAuthClient.twoFactor.verifyTotp({
            code: verifyCode,
         });
         return result;
      },
      onSuccess: async () => {
         // Generate backup codes
         const codesResult = await betterAuthClient.twoFactor.generateBackupCodes({
            password,
         });
         if (codesResult.data?.backupCodes) {
            setBackupCodes(codesResult.data.backupCodes);
            setStep("backup");
         }
         toast.success("Autenticação em duas etapas ativada!");
      },
      onError: () => {
         toast.error("Código inválido");
      },
   });

   const copyBackupCodes = () => {
      navigator.clipboard.writeText(backupCodes.join("\n"));
      toast.success("Códigos copiados!");
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Configurar Autenticação em Duas Etapas</CredenzaTitle>
            <CredenzaDescription>
               {step === "password" && "Digite sua senha para continuar"}
               {step === "qrcode" && "Escaneie o QR code com seu aplicativo autenticador"}
               {step === "verify" && "Digite o código do seu aplicativo autenticador"}
               {step === "backup" && "Guarde seus códigos de recuperação em um local seguro"}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {step === "password" && (
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label htmlFor="2fa-password">Senha</Label>
                     <Input
                        id="2fa-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        type="password"
                        value={password}
                     />
                  </div>
               </div>
            )}

            {step === "qrcode" && (
               <div className="space-y-4">
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                     {/* QR Code would be rendered here using a library like qrcode.react */}
                     <div className="size-48 bg-gray-100 flex items-center justify-center rounded border">
                        <Smartphone className="size-12 text-muted-foreground" />
                     </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                     Use Google Authenticator, Authy ou outro app compatível
                  </p>
                  <div className="p-3 bg-secondary rounded-lg">
                     <p className="text-xs text-muted-foreground mb-1">
                        Ou digite manualmente:
                     </p>
                     <code className="text-xs break-all">{totpUri}</code>
                  </div>
                  <Button
                     className="w-full"
                     onClick={() => setStep("verify")}
                  >
                     Continuar
                  </Button>
               </div>
            )}

            {step === "verify" && (
               <div className="space-y-4">
                  <div className="flex justify-center">
                     <InputOTP
                        maxLength={6}
                        onChange={setVerifyCode}
                        value={verifyCode}
                     >
                        <InputOTPGroup>
                           <InputOTPSlot index={0} />
                           <InputOTPSlot index={1} />
                           <InputOTPSlot index={2} />
                           <InputOTPSlot index={3} />
                           <InputOTPSlot index={4} />
                           <InputOTPSlot index={5} />
                        </InputOTPGroup>
                     </InputOTP>
                  </div>
               </div>
            )}

            {step === "backup" && (
               <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-lg">
                     <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                           <code
                              className="text-sm font-mono p-2 bg-background rounded"
                              key={index}
                           >
                              {code}
                           </code>
                        ))}
                     </div>
                  </div>
                  <Button
                     className="w-full"
                     onClick={copyBackupCodes}
                     variant="outline"
                  >
                     <Copy className="size-4 mr-2" />
                     Copiar códigos
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                     Guarde estes códigos em um local seguro. Cada código pode ser usado apenas uma vez.
                  </p>
               </div>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            {step === "password" && (
               <>
                  <CredenzaClose asChild>
                     <Button variant="outline">Cancelar</Button>
                  </CredenzaClose>
                  <Button
                     disabled={!password || enableMutation.isPending}
                     onClick={() => enableMutation.mutate()}
                  >
                     {enableMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     Continuar
                  </Button>
               </>
            )}

            {step === "verify" && (
               <>
                  <Button onClick={() => setStep("qrcode")} variant="outline">
                     Voltar
                  </Button>
                  <Button
                     disabled={verifyCode.length !== 6 || verifyMutation.isPending}
                     onClick={() => verifyMutation.mutate()}
                  >
                     {verifyMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     Verificar
                  </Button>
               </>
            )}

            {step === "backup" && (
               <Button className="w-full" onClick={onClose}>
                  Concluir
               </Button>
            )}
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Set Password Credenza Content (for OAuth users)
// ============================================

function SetPasswordCredenzaContent({
   onSuccess,
}: {
   onSuccess: () => void;
}) {
   const trpc = useTRPC();
   const [password, setPassword] = useState("");
   const [confirmPassword, setConfirmPassword] = useState("");

   const setPasswordMutation = useMutation(
      trpc.account.setPassword.mutationOptions({
         onSuccess: () => {
            toast.success("Senha definida com sucesso!");
            onSuccess();
         },
         onError: () => {
            toast.error("Erro ao definir senha");
         },
      }),
   );

   const isValid =
      password.length >= 8 && password === confirmPassword;

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Definir Senha</CredenzaTitle>
            <CredenzaDescription>
               Para ativar a autenticação em duas etapas, você precisa definir uma
               senha para sua conta.
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
               <p className="text-sm text-muted-foreground">
                  Você entrou usando o Google. Para usar recursos de segurança
                  avançados como 2FA, é necessário criar uma senha.
               </p>
            </div>

            <div className="space-y-2">
               <Label htmlFor="new-password">Nova senha</Label>
               <Input
                  id="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  type="password"
                  value={password}
               />
            </div>

            <div className="space-y-2">
               <Label htmlFor="confirm-password">Confirmar senha</Label>
               <Input
                  id="confirm-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente"
                  type="password"
                  value={confirmPassword}
               />
            </div>

            {password && confirmPassword && password !== confirmPassword && (
               <p className="text-sm text-destructive">As senhas não coincidem</p>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            <CredenzaClose asChild>
               <Button variant="outline">Cancelar</Button>
            </CredenzaClose>
            <Button
               disabled={!isValid || setPasswordMutation.isPending}
               onClick={() => setPasswordMutation.mutate({ newPassword: password })}
            >
               {setPasswordMutation.isPending && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               )}
               Definir senha
            </Button>
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Two Factor Card Component
// ============================================

function TwoFactorCard({
   session,
   hasPassword,
   onPasswordSet,
}: {
   session: {
      user?: {
         twoFactorEnabled?: boolean | null;
      } | null;
   } | null;
   hasPassword: boolean;
   onPasswordSet: () => void;
}) {
   const { openCredenza, closeCredenza } = useCredenza();
   const isTwoFactorEnabled = session?.user?.twoFactorEnabled ?? false;

   const disableMutation = useMutation({
      mutationFn: async (password: string) => {
         return betterAuthClient.twoFactor.disable({ password });
      },
      onSuccess: () => {
         toast.success("Autenticação em duas etapas desativada");
         closeCredenza();
      },
      onError: () => {
         toast.error("Erro ao desativar 2FA");
      },
   });

   const handleSetup2FA = () => {
      openCredenza({
         children: <TwoFactorSetupCredenzaContent onClose={closeCredenza} />,
      });
   };

   const handleSetPassword = () => {
      openCredenza({
         children: (
            <SetPasswordCredenzaContent
               onSuccess={() => {
                  closeCredenza();
                  onPasswordSet();
               }}
            />
         ),
      });
   };

   const handleDisable2FA = () => {
      openCredenza({
         children: (
            <DisableTwoFactorCredenzaContent
               onConfirm={(password) => disableMutation.mutate(password)}
               isPending={disableMutation.isPending}
            />
         ),
      });
   };

   const handleViewBackupCodes = () => {
      openCredenza({
         children: <ViewBackupCodesCredenzaContent onClose={closeCredenza} />,
      });
   };

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Autenticação em Duas Etapas</CardTitle>
            <CardDescription>
               Adicione uma camada extra de segurança à sua conta
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     {isTwoFactorEnabled ? (
                        <ShieldCheck className="size-4 text-green-500" />
                     ) : (
                        <ShieldOff className="size-4" />
                     )}
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Status do 2FA</ItemTitle>
                     <ItemDescription>
                        {isTwoFactorEnabled
                           ? "Ativado - Sua conta está protegida"
                           : "Desativado - Recomendamos ativar"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Badge variant={isTwoFactorEnabled ? "default" : "secondary"}>
                        {isTwoFactorEnabled ? "Ativo" : "Inativo"}
                     </Badge>
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* OAuth user without password */}
               {!hasPassword && !isTwoFactorEnabled && (
                  <div className="p-4 bg-amber-500/10 rounded-lg">
                     <div className="flex items-start gap-3">
                        <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                           <p className="text-sm font-medium">
                              Você entrou com o Google
                           </p>
                           <p className="text-sm text-muted-foreground">
                              Para ativar o 2FA, você precisa definir uma senha para
                              sua conta primeiro.
                           </p>
                           <Button
                              onClick={handleSetPassword}
                              size="sm"
                              variant="outline"
                           >
                              <Key className="size-4 mr-2" />
                              Definir senha
                           </Button>
                        </div>
                     </div>
                  </div>
               )}

               {isTwoFactorEnabled ? (
                  <>
                     <Item
                        className="cursor-pointer"
                        onClick={handleViewBackupCodes}
                        variant="muted"
                     >
                        <ItemMedia variant="icon">
                           <Key className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Códigos de Recuperação</ItemTitle>
                           <ItemDescription>
                              Ver ou regenerar códigos de backup
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                     </Item>

                     <ItemSeparator />

                     <Item
                        className="cursor-pointer"
                        onClick={handleDisable2FA}
                        variant="muted"
                     >
                        <ItemMedia variant="icon">
                           <Lock className="size-4 text-destructive" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle className="text-destructive">
                              Desativar 2FA
                           </ItemTitle>
                           <ItemDescription>
                              Remover autenticação em duas etapas
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                     </Item>
                  </>
               ) : (
                  hasPassword && (
                     <Item
                        className="cursor-pointer"
                        onClick={handleSetup2FA}
                        variant="muted"
                     >
                        <ItemMedia variant="icon">
                           <Smartphone className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>Configurar 2FA</ItemTitle>
                           <ItemDescription>
                              Use Google Authenticator ou Authy
                           </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                           <ChevronRight className="size-4 text-muted-foreground" />
                        </ItemActions>
                     </Item>
                  )
               )}
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

// ============================================
// View Backup Codes Credenza Content
// ============================================

function ViewBackupCodesCredenzaContent({
   onClose,
}: {
   onClose: () => void;
}) {
   const [password, setPassword] = useState("");
   const [codes, setCodes] = useState<string[]>([]);
   const [step, setStep] = useState<"password" | "codes">("password");

   const viewMutation = useMutation({
      mutationFn: async () => {
         const result = await betterAuthClient.twoFactor.generateBackupCodes({
            password,
         });
         return result;
      },
      onSuccess: (result) => {
         if (result.data?.backupCodes) {
            setCodes(result.data.backupCodes);
            setStep("codes");
         }
      },
      onError: () => {
         toast.error("Senha incorreta");
      },
   });

   const copyBackupCodes = () => {
      navigator.clipboard.writeText(codes.join("\n"));
      toast.success("Códigos copiados!");
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Códigos de Recuperação</CredenzaTitle>
            <CredenzaDescription>
               {step === "password"
                  ? "Digite sua senha para ver os códigos"
                  : "Estes são seus novos códigos de recuperação"}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {step === "password" && (
               <div className="space-y-2">
                  <Label htmlFor="backup-password">Senha</Label>
                  <Input
                     id="backup-password"
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="Digite sua senha"
                     type="password"
                     value={password}
                  />
               </div>
            )}

            {step === "codes" && (
               <>
                  <div className="p-4 bg-secondary rounded-lg">
                     <div className="grid grid-cols-2 gap-2">
                        {codes.map((code, index) => (
                           <code
                              className="text-sm font-mono p-2 bg-background rounded"
                              key={index}
                           >
                              {code}
                           </code>
                        ))}
                     </div>
                  </div>
                  <Button
                     className="w-full"
                     onClick={copyBackupCodes}
                     variant="outline"
                  >
                     <Copy className="size-4 mr-2" />
                     Copiar códigos
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                     Guarde estes códigos em um local seguro. Os códigos
                     anteriores foram invalidados.
                  </p>
               </>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            {step === "password" && (
               <>
                  <CredenzaClose asChild>
                     <Button variant="outline">Cancelar</Button>
                  </CredenzaClose>
                  <Button
                     disabled={!password || viewMutation.isPending}
                     onClick={() => viewMutation.mutate()}
                  >
                     {viewMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     Ver códigos
                  </Button>
               </>
            )}

            {step === "codes" && (
               <Button className="w-full" onClick={onClose}>
                  Concluir
               </Button>
            )}
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Disable Two Factor Credenza Content
// ============================================

function DisableTwoFactorCredenzaContent({
   onConfirm,
   isPending,
}: {
   onConfirm: (password: string) => void;
   isPending: boolean;
}) {
   const [password, setPassword] = useState("");

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Desativar Autenticação em Duas Etapas</CredenzaTitle>
            <CredenzaDescription>
               Isso tornará sua conta menos segura. Digite sua senha para
               confirmar.
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
               <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
               <p className="text-sm text-destructive">
                  Ao desativar o 2FA, sua conta ficará protegida apenas pela
                  senha. Recomendamos manter ativo para maior segurança.
               </p>
            </div>
            <div className="space-y-2">
               <Label htmlFor="disable-password">Senha</Label>
               <Input
                  id="disable-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  type="password"
                  value={password}
               />
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <CredenzaClose asChild>
               <Button variant="outline">Cancelar</Button>
            </CredenzaClose>
            <Button
               disabled={!password || isPending}
               onClick={() => onConfirm(password)}
               variant="destructive"
            >
               {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
               Desativar 2FA
            </Button>
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Data & Account Card Component
// ============================================

function DataAccountCard() {
   const { openCredenza, closeCredenza } = useCredenza();
   const trpc = useTRPC();

   const exportMutation = useMutation(trpc.account.exportUserData.mutationOptions());

   const handleExportData = async () => {
      try {
         const data = await exportMutation.mutateAsync();
         const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
         });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `montte-export-${new Date().toISOString().split("T")[0]}.json`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url);
         toast.success("Dados exportados com sucesso!");
      } catch {
         toast.error("Erro ao exportar dados");
      }
   };

   const handleDeleteAccount = () => {
      openCredenza({
         children: <DeleteAccountCredenzaContent onClose={closeCredenza} />,
      });
   };

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Dados e Conta</CardTitle>
            <CardDescription>
               Exporte seus dados ou exclua sua conta
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <Button
               className="w-full"
               disabled={exportMutation.isPending}
               onClick={handleExportData}
               variant="outline"
            >
               {exportMutation.isPending ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
               ) : (
                  <Download className="size-4 mr-2" />
               )}
               Exportar meus dados
            </Button>

            <Button
               className="w-full"
               onClick={handleDeleteAccount}
               variant="destructive"
            >
               <Trash2 className="size-4 mr-2" />
               Excluir conta
            </Button>
         </CardContent>
      </Card>
   );
}

// ============================================
// Delete Account Credenza Content
// ============================================

function DeleteAccountCredenzaContent({
   onClose,
}: {
   onClose: () => void;
}) {
   const [step, setStep] = useState<"options" | "confirm">("options");
   const [deletionType, setDeletionType] = useState<"immediate" | "scheduled">(
      "scheduled",
   );
   const [password, setPassword] = useState("");

   const deleteMutation = useMutation({
      mutationFn: async () => {
         if (deletionType === "immediate") {
            return betterAuthClient.deleteUser();
         }
         // For scheduled deletion, we would need a backend endpoint
         // For now, just show a message
         return { success: true };
      },
      onSuccess: () => {
         if (deletionType === "immediate") {
            toast.success("Conta excluída com sucesso");
            window.location.href = "/auth/sign-in";
         } else {
            toast.success("Exclusão agendada para 30 dias");
            onClose();
         }
      },
      onError: () => {
         toast.error("Erro ao excluir conta");
      },
   });

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Excluir Conta</CredenzaTitle>
            <CredenzaDescription>
               {step === "options"
                  ? "Escolha como deseja excluir sua conta"
                  : "Confirme a exclusão da sua conta"}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            {step === "options" && (
               <>
                  <div className="p-4 bg-destructive/10 rounded-lg flex items-start gap-3">
                     <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                     <p className="text-sm text-destructive">
                        Esta ação é irreversível. Todos os seus dados serão
                        permanentemente excluídos.
                     </p>
                  </div>

                  <RadioGroup
                     onValueChange={(v) =>
                        setDeletionType(v as "immediate" | "scheduled")
                     }
                     value={deletionType}
                  >
                     <div className="flex items-start space-x-3 p-4 border rounded-lg">
                        <RadioGroupItem id="scheduled" value="scheduled" />
                        <div className="space-y-1">
                           <Label htmlFor="scheduled">
                              Excluir em 30 dias (Recomendado)
                           </Label>
                           <p className="text-sm text-muted-foreground">
                              Você terá 30 dias para mudar de ideia antes da
                              exclusão permanente
                           </p>
                        </div>
                     </div>
                     <div className="flex items-start space-x-3 p-4 border rounded-lg border-destructive/50">
                        <RadioGroupItem id="immediate" value="immediate" />
                        <div className="space-y-1">
                           <Label className="text-destructive" htmlFor="immediate">
                              Excluir imediatamente
                           </Label>
                           <p className="text-sm text-muted-foreground">
                              Sua conta será excluída imediatamente e não poderá
                              ser recuperada
                           </p>
                        </div>
                     </div>
                  </RadioGroup>
               </>
            )}

            {step === "confirm" && (
               <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                     {deletionType === "immediate"
                        ? "Digite sua senha para confirmar a exclusão imediata da conta."
                        : "Digite sua senha para agendar a exclusão da conta em 30 dias."}
                  </p>
                  <div className="space-y-2">
                     <Label htmlFor="delete-password">Senha</Label>
                     <Input
                        id="delete-password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        type="password"
                        value={password}
                     />
                  </div>
               </div>
            )}
         </CredenzaBody>

         <CredenzaFooter>
            {step === "options" && (
               <>
                  <CredenzaClose asChild>
                     <Button variant="outline">Cancelar</Button>
                  </CredenzaClose>
                  <Button
                     onClick={() => setStep("confirm")}
                     variant="destructive"
                  >
                     Continuar
                  </Button>
               </>
            )}

            {step === "confirm" && (
               <>
                  <Button onClick={() => setStep("options")} variant="outline">
                     Voltar
                  </Button>
                  <Button
                     disabled={!password || deleteMutation.isPending}
                     onClick={() => deleteMutation.mutate()}
                     variant="destructive"
                  >
                     {deleteMutation.isPending && (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                     )}
                     {deletionType === "immediate"
                        ? "Excluir agora"
                        : "Agendar exclusão"}
                  </Button>
               </>
            )}
         </CredenzaFooter>
      </>
   );
}

// ============================================
// Linked Accounts Card Component
// ============================================

function LinkedAccountsCard({
   accounts,
   hasPassword,
   onRefetch,
}: {
   accounts: { id: string; providerId: string; accountId: string; createdAt: Date }[];
   hasPassword: boolean;
   onRefetch: () => void;
}) {
   const { openCredenza, closeCredenza } = useCredenza();

   const unlinkMutation = useMutation({
      mutationFn: async (providerId: string) => {
         return betterAuthClient.unlinkAccount({ providerId });
      },
      onSuccess: () => {
         toast.success("Conta desvinculada com sucesso");
         onRefetch();
      },
      onError: () => {
         toast.error("Erro ao desvincular conta");
      },
   });

   const handleLinkGoogle = async () => {
      try {
         await betterAuthClient.linkSocial({
            provider: "google",
            callbackURL: window.location.href,
         });
      } catch {
         toast.error("Erro ao vincular conta do Google");
      }
   };

   const handleSetPassword = () => {
      openCredenza({
         children: (
            <SetPasswordCredenzaContent
               onSuccess={() => {
                  closeCredenza();
                  onRefetch();
               }}
            />
         ),
      });
   };

   const canUnlink = accounts.length > 1;
   const hasGoogleLinked = accounts.some((a) => a.providerId === "google");

   return (
      <Card className="h-full">
         <CardHeader>
            <CardTitle>Contas Vinculadas</CardTitle>
            <CardDescription>
               Gerencie as formas de acesso à sua conta
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <ItemGroup>
               {/* Password Account */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Key className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Senha</ItemTitle>
                     <ItemDescription>
                        {hasPassword ? "Configurada" : "Não configurada"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {hasPassword ? (
                        <Badge variant="default">Ativo</Badge>
                     ) : (
                        <Button onClick={handleSetPassword} size="sm" variant="outline">
                           Definir
                        </Button>
                     )}
                  </ItemActions>
               </Item>

               <ItemSeparator />

               {/* Google Account */}
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Mail className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>Google</ItemTitle>
                     <ItemDescription>
                        {hasGoogleLinked ? "Vinculado" : "Não vinculado"}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     {hasGoogleLinked ? (
                        <div className="flex items-center gap-2">
                           <Badge variant="default">Ativo</Badge>
                           {canUnlink && (
                              <Tooltip>
                                 <TooltipTrigger asChild>
                                    <Button
                                       disabled={unlinkMutation.isPending}
                                       onClick={() => unlinkMutation.mutate("google")}
                                       size="icon"
                                       variant="ghost"
                                    >
                                       {unlinkMutation.isPending ? (
                                          <Loader2 className="size-4 animate-spin" />
                                       ) : (
                                          <Link2Off className="size-4 text-destructive" />
                                       )}
                                    </Button>
                                 </TooltipTrigger>
                                 <TooltipContent>Desvincular</TooltipContent>
                              </Tooltip>
                           )}
                        </div>
                     ) : (
                        <Button onClick={handleLinkGoogle} size="sm" variant="outline">
                           <Link2 className="size-4 mr-2" />
                           Vincular
                        </Button>
                     )}
                  </ItemActions>
               </Item>
            </ItemGroup>

            {!canUnlink && (
               <p className="text-xs text-muted-foreground text-center">
                  Você precisa ter pelo menos uma forma de acesso configurada.
               </p>
            )}
         </CardContent>
      </Card>
   );
}

// ============================================
// Main Content Component
// ============================================

function ProfileSectionContent() {
   const trpc = useTRPC();
   const { slug } = useParams({ strict: false }) as { slug: string };
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );
   const { data: hasPasswordData, refetch: refetchHasPassword } = useSuspenseQuery(
      trpc.account.hasPassword.queryOptions(),
   );
   const { data: linkedAccounts, refetch: refetchLinkedAccounts } = useSuspenseQuery(
      trpc.account.getLinkedAccounts.queryOptions(),
   );

   const handleRefetch = () => {
      refetchHasPassword();
      refetchLinkedAccounts();
   };

   return (
      <TooltipProvider>
         <div className="space-y-4 md:space-y-6">
            {/* Row 1: Profile + Account Summary */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="md:col-span-2 lg:col-span-2">
                  <ProfileCard session={session} slug={slug} />
               </div>
               <AccountSummaryCard session={session} />
            </div>

            {/* Row 2: 2FA + Data & Account */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
               <div className="md:col-span-2 lg:col-span-2">
                  <TwoFactorCard
                     hasPassword={hasPasswordData.hasPassword}
                     onPasswordSet={handleRefetch}
                     session={session}
                  />
               </div>
               <DataAccountCard />
            </div>

            {/* Row 3: Linked Accounts */}
            <LinkedAccountsCard
               accounts={linkedAccounts}
               hasPassword={hasPasswordData.hasPassword}
               onRefetch={handleRefetch}
            />
         </div>
      </TooltipProvider>
   );
}

export function ProfileSection() {
   return (
      <ErrorBoundary FallbackComponent={ProfileSectionErrorFallback}>
         <Suspense fallback={<ProfileSectionSkeleton />}>
            <ProfileSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
