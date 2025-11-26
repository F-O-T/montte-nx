import { createFileRoute } from "@tanstack/react-router";
import { TagDetailsPage } from "@/pages/tag-details/ui/tag-details-page";

export const Route = createFileRoute("/_dashboard/$slug/tags/$tagId")({
   component: TagDetailsPage,
});
