import {
   Breadcrumb,
   BreadcrumbItem,
   BreadcrumbLink,
   BreadcrumbList,
   BreadcrumbPage,
   BreadcrumbSeparator,
} from "@packages/ui/components/breadcrumb";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { cn } from "@packages/ui/lib/utils";
import { Link, useMatches } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function NavigationBreadcrumb() {
   const matches = useMatches();

   // Filter matches that have breadcrumb metadata and exclude layout routes
   const contentBreadcrumbs = matches
      .filter((match) => {
         // Skip routes that are just layout wrappers
         const isLayoutRoute =
            match.pathname === "/" || // root route
            match.id === "/_dashboard"; // dashboard layout route

         return match.staticData?.breadcrumb !== undefined && !isLayoutRoute;
      })
      .map((match) => ({
         href: match.pathname,
         label: match.staticData.breadcrumb as string,
      }));

   // Check if we're on a page that shows "Home" as a breadcrumb
   const isHomeBreadcrumbPage = contentBreadcrumbs.some(
      (breadcrumb) =>
         breadcrumb.label === "Home" || breadcrumb.href === "/home",
   );

   // Build breadcrumbs - always start with home icon, but don't add duplicate home text
   let allBreadcrumbs = [
      {
         href: "/home",
         isHome: true,
         label: "Home",
      },
   ];

   // Only add content breadcrumbs if we're not on a home breadcrumb page
   if (!isHomeBreadcrumbPage) {
      allBreadcrumbs = [
         ...allBreadcrumbs,
         ...contentBreadcrumbs.map((breadcrumb) => ({
            ...breadcrumb,
            isHome: false,
         })),
      ];
   }

   // On home page, show only the home icon (not clickable)
   const isOnHomePage =
      allBreadcrumbs.length === 1 && allBreadcrumbs[0]?.isHome;

   if (isOnHomePage) {
      return (
         <Breadcrumb>
            <BreadcrumbList>
               <BreadcrumbItem>
                  <BreadcrumbPage className={cn("flex items-center")}>
                     <Home className={cn("size-4")} />
                  </BreadcrumbPage>
               </BreadcrumbItem>
            </BreadcrumbList>
         </Breadcrumb>
      );
   }

   return (
      <TooltipProvider>
         <Breadcrumb>
            <BreadcrumbList>
               {allBreadcrumbs.map((breadcrumb, index) => {
                  const isLast = index === allBreadcrumbs.length - 1;

                  return (
                     <>
                        {index > 0 && (
                           <BreadcrumbSeparator key={`sep-${index + 1}`} />
                        )}

                        <BreadcrumbItem key={breadcrumb.href}>
                           {isLast ? (
                              <BreadcrumbPage className={cn("font-medium")}>
                                 {breadcrumb.isHome ? (
                                    <Home className={cn("size-4")} />
                                 ) : (
                                    breadcrumb.label
                                 )}
                              </BreadcrumbPage>
                           ) : (
                              <BreadcrumbLink asChild>
                                 <Link
                                    className="hover:text-foreground"
                                    onClick={(e) => {
                                       // Prevent navigation if it's the same page
                                       if (
                                          window.location.pathname ===
                                          breadcrumb.href
                                       ) {
                                          e.preventDefault();
                                       }
                                    }}
                                    to={breadcrumb.href}
                                 >
                                    {breadcrumb.isHome ? (
                                       <Tooltip>
                                          <TooltipTrigger asChild>
                                             <Home className={cn("size-4")} />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                             <p>Go back to home page</p>
                                          </TooltipContent>
                                       </Tooltip>
                                    ) : (
                                       breadcrumb.label
                                    )}
                                 </Link>
                              </BreadcrumbLink>
                           )}
                        </BreadcrumbItem>
                     </>
                  );
               })}
            </BreadcrumbList>
         </Breadcrumb>
      </TooltipProvider>
   );
}
