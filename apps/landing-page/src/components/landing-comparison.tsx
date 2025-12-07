"use client";

import {
   FeatureComparison,
   type FeatureComparisonCategory,
   type FeatureComparisonPlan,
} from "@packages/ui/components/feature-comparison";
import { Leaf, Lock, Users } from "lucide-react";

const plans: FeatureComparisonPlan[] = [
   {
      icon: <Leaf className="size-4" />,
      id: "spreadsheets",
      name: "Spreadsheets",
   },
   {
      highlighted: true,
      icon: <Lock className="size-4" />,
      id: "closedApps",
      name: "Closed Apps",
   },
   {
      cta: { href: "/signup", text: "Start Free" },
      icon: <Users className="size-4" />,
      id: "montte",
      name: "Montte",
   },
];

const categories: FeatureComparisonCategory[] = [
   {
      description: "Essential tools for managing your finances effectively",
      features: [
         {
            name: "Transaction Tracking",
            values: { closedApps: true, montte: true, spreadsheets: true },
         },
         {
            name: "Data Storage",
            values: {
               closedApps: "5 GB",
               montte: "Unlimited",
               spreadsheets: "Local Only",
            },
         },
         {
            name: "Custom Categories",
            values: { closedApps: true, montte: true, spreadsheets: true },
         },
         {
            name: "Multi-Currency",
            values: { closedApps: true, montte: true, spreadsheets: false },
         },
         {
            name: "Bill Reminders",
            values: { closedApps: true, montte: true, spreadsheets: false },
         },
         {
            name: "Split Transactions",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
      ],
      name: "Core Features",
   },
   {
      description: "Control and ownership of your financial data",
      features: [
         {
            name: "Full Data Ownership",
            values: { closedApps: false, montte: true, spreadsheets: true },
         },
         {
            name: "Self-Hosting Option",
            values: { closedApps: false, montte: true, spreadsheets: true },
         },
         {
            name: "Data Export",
            values: { closedApps: false, montte: true, spreadsheets: true },
         },
         {
            name: "Open Source Code",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "No Vendor Lock-in",
            values: { closedApps: false, montte: true, spreadsheets: true },
         },
         {
            name: "Audit Trail",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
      ],
      name: "Data & Privacy",
   },
   {
      description: "Work together with your team or family",
      features: [
         {
            name: "Team Workspaces",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "Real-time Sync",
            values: { closedApps: true, montte: true, spreadsheets: false },
         },
         {
            name: "Role-based Access",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "Shared Budgets",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "Activity History",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "Unlimited Members",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
      ],
      name: "Collaboration",
   },
   {
      description: "Insights to make better financial decisions",
      features: [
         {
            name: "Spending Reports",
            values: { closedApps: true, montte: true, spreadsheets: false },
         },
         {
            name: "Budget Tracking",
            values: { closedApps: true, montte: true, spreadsheets: false },
         },
         {
            name: "Custom Dashboards",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "Trend Analysis",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
         {
            name: "PDF Reports",
            values: { closedApps: false, montte: true, spreadsheets: false },
         },
      ],
      name: "Analytics",
   },
];

export function LandingComparison() {
   return (
      <FeatureComparison
         categories={categories}
         initialVisibleCategories={3}
         plans={plans}
         showExpandButton={true}
      />
   );
}
