import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { agentId, sdk } from "../contentagen";

//@ts-expect-error
export const GET = async (context) => {
   const response = await sdk.listContentByAgent({
      agentId: agentId,
      limit: 100,
      page: 1,
      status: ["approved"],
   });
   const posts = response.posts ?? [];

   return rss({
      description: SITE_DESCRIPTION,
      items: posts.map((post) => ({
         categories: post.meta.keywords ?? [],
         description: post.meta?.description ?? "",
         link: new URL(post.meta?.slug ?? "", context.site).toString(),
         pubDate: post.createdAt,
         title: post.meta?.title ?? "",
      })),
      site: context.site,
      title: SITE_TITLE,
   });
};
