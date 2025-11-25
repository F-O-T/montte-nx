import { useCurrentSlug } from "@/hooks/use-dashboard-navigate";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

type DashboardRoute =
   | "/home"
   | "/transactions"
   | "/categories"
   | "/bank-accounts"
   | "/bills"
   | "/organization"
   | "/organization/members"
   | "/organization/invites"
   | "/organization/teams"
   | "/profile"
   | "/reports";

type SlugRoute =
   | "/$slug/home"
   | "/$slug/transactions"
   | "/$slug/categories"
   | "/$slug/bank-accounts"
   | "/$slug/bills"
   | "/$slug/organization"
   | "/$slug/organization/members"
   | "/$slug/organization/invites"
   | "/$slug/organization/teams"
   | "/$slug/profile"
   | "/$slug/reports";

const routeMap: Record<DashboardRoute, SlugRoute> = {
   "/bank-accounts": "/$slug/bank-accounts",
   "/bills": "/$slug/bills",
   "/categories": "/$slug/categories",
   "/home": "/$slug/home",
   "/organization": "/$slug/organization",
   "/organization/invites": "/$slug/organization/invites",
   "/organization/members": "/$slug/organization/members",
   "/organization/teams": "/$slug/organization/teams",
   "/profile": "/$slug/profile",
   "/reports": "/$slug/reports",
   "/transactions": "/$slug/transactions",
};

type DashboardLinkProps = Omit<LinkProps, "to" | "params"> & {
   children: ReactNode;
   slug?: string;
   to: DashboardRoute;
};

export function DashboardLink({
   children,
   slug,
   to,
   ...props
}: DashboardLinkProps) {
   const currentSlug = useCurrentSlug();
   const resolvedSlug = slug ?? currentSlug;
   const mappedRoute = routeMap[to];

   return (
      <Link params={{ slug: resolvedSlug }} to={mappedRoute} {...props}>
         {children}
      </Link>
   );
}

