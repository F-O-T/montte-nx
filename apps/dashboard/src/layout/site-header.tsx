import {
   Breadcrumb,
   BreadcrumbItem,
   BreadcrumbLink,
   BreadcrumbList,
   BreadcrumbPage,
   BreadcrumbSeparator,
} from "@packages/ui/components/breadcrumb";
import { Separator } from "@packages/ui/components/separator";
import { SidebarTrigger } from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";

//TODO mexer aqui
function generateBreadcrumbs(pathname: string) {
   const segments = pathname.split("/").filter(Boolean);
   const breadcrumbs = [{ href: "/_dashboard/home", label: "Dashboard" }];

   let currentPath = "/_dashboard";
   for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;
      currentPath += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ href: currentPath, label });
   }

   return breadcrumbs;
}

export function SiteHeader() {
   const location = useLocation();
   const breadcrumbs = generateBreadcrumbs(
      location.pathname || "/_dashboard/home",
   );

   return (
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
         <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
               className="mx-2 data-[orientation=vertical]:h-4"
               orientation="vertical"
            />
            <Breadcrumb>
               <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                     <div className="flex items-center" key={crumb.href}>
                        <BreadcrumbItem>
                           {index === breadcrumbs.length - 1 ? (
                              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                           ) : (
                              <BreadcrumbLink asChild>
                                 <Link to={crumb.href}>{crumb.label}</Link>
                              </BreadcrumbLink>
                           )}
                        </BreadcrumbItem>
                        {index < breadcrumbs.length - 1 && (
                           <BreadcrumbSeparator />
                        )}
                     </div>
                  ))}
               </BreadcrumbList>
            </Breadcrumb>
         </div>
      </header>
   );
}
