import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Carousel,
   CarouselContent,
   CarouselItem,
   CarouselNext,
   CarouselPrevious,
} from "@packages/ui/components/carousel";
import { Item, ItemContent, ItemHeader } from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   Download,
   ExternalLink,
   FileText,
   Loader2,
   Trash2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useTRPC } from "@/integrations/clients";

function GalleryErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar anexos</AlertDescription>
      </Alert>
   );
}

function GallerySkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
         </CardHeader>
         <CardContent>
            <Skeleton className="aspect-square w-full rounded-lg" />
         </CardContent>
      </Card>
   );
}

function isImageContentType(contentType: string | null): boolean {
   if (!contentType) return false;
   return contentType.startsWith("image/");
}

function AttachmentThumbnail({
   attachment,
   transactionId,
}: {
   attachment: {
      id: string;
      fileName: string;
      contentType: string | null;
      fileSize: number | null;
   };
   transactionId: string;
}) {
   const trpc = useTRPC();
   const isImage = isImageContentType(attachment.contentType);

   const { data: thumbnailData, isLoading: thumbnailLoading } = useQuery({
      ...trpc.transactions.getAttachmentData.queryOptions({
         attachmentId: attachment.id,
         transactionId,
      }),
      enabled: isImage,
      staleTime: 1000 * 60 * 10,
   });

   if (!isImage) {
      return (
         <div className="aspect-square w-full rounded-lg bg-red-50 flex flex-col items-center justify-center gap-2">
            <FileText className="size-12 text-red-500" />
            <span className="text-xs text-muted-foreground truncate max-w-[90%] px-2">
               {attachment.fileName}
            </span>
         </div>
      );
   }

   if (thumbnailLoading) {
      return <Skeleton className="aspect-square w-full rounded-lg" />;
   }

   if (thumbnailData?.data) {
      return (
         <img
            alt={attachment.fileName}
            className="aspect-square w-full max-h-68 rounded-lg object-cover object-top"
            src={thumbnailData.data}
         />
      );
   }

   return (
      <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center">
         <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
   );
}

function GalleryContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { openAlertDialog } = useAlertDialog();
   const [loadingAttachmentId, setLoadingAttachmentId] = useState<
      string | null
   >(null);

   const { data: attachments = [] } = useQuery(
      trpc.transactions.getAttachments.queryOptions({
         transactionId: transactionId,
      }),
   );

   const deleteAttachmentMutation = useMutation(
      trpc.transactions.deleteAttachment.mutationOptions({
         onError: () => {
            toast.error("Falha ao remover anexo");
         },
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.transactions.getAttachments.queryKey({
                  transactionId,
               }),
            });
            toast.success("Anexo removido com sucesso");
         },
      }),
   );

   const handleOpenAttachment = async (attachmentId: string) => {
      setLoadingAttachmentId(attachmentId);
      try {
         const attachmentData = await queryClient.fetchQuery(
            trpc.transactions.getAttachmentData.queryOptions({
               attachmentId,
               transactionId,
            }),
         );
         if (attachmentData?.data) {
            window.open(attachmentData.data, "_blank");
         }
      } finally {
         setLoadingAttachmentId(null);
      }
   };

   const handleDownloadAttachment = async (
      attachmentId: string,
      fileName: string,
   ) => {
      setLoadingAttachmentId(attachmentId);
      try {
         const attachmentData = await queryClient.fetchQuery(
            trpc.transactions.getAttachmentData.queryOptions({
               attachmentId,
               transactionId,
            }),
         );
         if (attachmentData?.data) {
            const link = document.createElement("a");
            link.href = attachmentData.data;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
         }
      } finally {
         setLoadingAttachmentId(null);
      }
   };

   const handleDeleteAttachment = (attachmentId: string) => {
      openAlertDialog({
         actionLabel: "Remover",
         cancelLabel: "Cancelar",
         description:
            "Tem certeza que deseja remover este anexo? Esta ação não pode ser desfeita.",
         onAction: async () => {
            await deleteAttachmentMutation.mutateAsync({
               attachmentId,
               transactionId,
            });
         },
         title: "Remover anexo",
         variant: "destructive",
      });
   };

   if (attachments.length === 0) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Anexos</CardTitle>
            <CardDescription>
               {attachments.length}{" "}
               {attachments.length === 1
                  ? "arquivo anexado"
                  : "arquivos anexados"}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Carousel className="w-full">
               <CarouselContent>
                  {attachments.map((attachment) => {
                     const isLoading = loadingAttachmentId === attachment.id;

                     return (
                        <CarouselItem key={attachment.id}>
                           <Item variant="outline">
                              <ItemHeader>
                                 <AttachmentThumbnail
                                    attachment={attachment}
                                    transactionId={transactionId}
                                 />
                              </ItemHeader>
                              <ItemContent>
                                 <div className="flex justify-center gap-1">
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <Button
                                             disabled={isLoading}
                                             onClick={() =>
                                                handleOpenAttachment(
                                                   attachment.id,
                                                )
                                             }
                                             size="icon"
                                             variant="outline"
                                          >
                                             {isLoading ? (
                                                <Loader2 className="size-4 animate-spin" />
                                             ) : (
                                                <ExternalLink className="size-4" />
                                             )}
                                          </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>Abrir</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <Button
                                             disabled={isLoading}
                                             onClick={() =>
                                                handleDownloadAttachment(
                                                   attachment.id,
                                                   attachment.fileName,
                                                )
                                             }
                                             size="icon"
                                             variant="outline"
                                          >
                                             <Download className="size-4" />
                                          </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>Baixar</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                       <TooltipTrigger asChild>
                                          <Button
                                             disabled={
                                                deleteAttachmentMutation.isPending
                                             }
                                             onClick={() =>
                                                handleDeleteAttachment(
                                                   attachment.id,
                                                )
                                             }
                                             size="icon"
                                             variant="outline"
                                          >
                                             <Trash2 className="size-4 text-destructive" />
                                          </Button>
                                       </TooltipTrigger>
                                       <TooltipContent>Remover</TooltipContent>
                                    </Tooltip>
                                 </div>
                              </ItemContent>
                           </Item>
                        </CarouselItem>
                     );
                  })}
               </CarouselContent>
               {attachments.length > 1 && (
                  <>
                     <CarouselPrevious className="-left-4" />
                     <CarouselNext className="-right-4" />
                  </>
               )}
            </Carousel>
         </CardContent>
      </Card>
   );
}

export function TransactionAttachmentsGallery({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={GalleryErrorFallback}>
         <Suspense fallback={<GallerySkeleton />}>
            <GalleryContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
