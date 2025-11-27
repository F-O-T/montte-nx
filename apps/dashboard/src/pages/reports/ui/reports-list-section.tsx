import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DatePicker } from "@packages/ui/components/date-picker";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@packages/ui/components/tabs";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { type PeriodPreset, useReports } from "../features/reports-context";
import { ReportsChartsContent } from "./reports-charts";

function ReportsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("dashboard.routes.reports.title")}</CardTitle>
            <CardDescription>
               {translate("dashboard.routes.reports.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.reports.errors.page.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.reports.errors.page.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function ReportsListSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("dashboard.routes.reports.title")}</CardTitle>
            <CardDescription>
               {translate("dashboard.routes.reports.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
               <Skeleton className="h-10 w-[200px]" />
            </div>
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-[400px]" />
         </CardContent>
      </Card>
   );
}

function PeriodFilterControls() {
   const { preset, setPreset, setCustomPeriod, startDate, endDate } =
      useReports();

   const handleStartDateChange = (date: Date | undefined) => {
      if (date) {
         setCustomPeriod(date, endDate);
      }
   };

   const handleEndDateChange = (date: Date | undefined) => {
      if (date) {
         const end = new Date(date);
         end.setHours(23, 59, 59);
         setCustomPeriod(startDate, end);
      }
   };

   return (
      <div className="flex flex-wrap items-end gap-4">
         <div className="flex-1 min-w-[200px] max-w-[300px]">
            <Select
               onValueChange={(value) => setPreset(value as PeriodPreset)}
               value={preset}
            >
               <SelectTrigger>
                  <SelectValue
                     placeholder={translate(
                        "dashboard.routes.reports.period-filter.placeholder",
                     )}
                  />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="current_month">
                     {translate(
                        "dashboard.routes.reports.period-filter.current-month",
                     )}
                  </SelectItem>
                  <SelectItem value="last_month">
                     {translate(
                        "dashboard.routes.reports.period-filter.last-month",
                     )}
                  </SelectItem>
                  <SelectItem value="current_year">
                     {translate(
                        "dashboard.routes.reports.period-filter.current-year",
                     )}
                  </SelectItem>
                  <SelectItem value="last_year">
                     {translate(
                        "dashboard.routes.reports.period-filter.last-year",
                     )}
                  </SelectItem>
                  <SelectItem value="custom">
                     {translate(
                        "dashboard.routes.reports.period-filter.custom",
                     )}
                  </SelectItem>
               </SelectContent>
            </Select>
         </div>

         {preset === "custom" && (
            <>
               <div className="min-w-[150px]">
                  <DatePicker
                     className="w-full"
                     date={startDate}
                     onSelect={handleStartDateChange}
                     placeholder={translate(
                        "dashboard.routes.reports.period-filter.start-date",
                     )}
                  />
               </div>
               <div className="min-w-[150px]">
                  <DatePicker
                     className="w-full"
                     date={endDate}
                     onSelect={handleEndDateChange}
                     placeholder={translate(
                        "dashboard.routes.reports.period-filter.end-date",
                     )}
                  />
               </div>
            </>
         )}
      </div>
   );
}

function ReportsListContent() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("dashboard.routes.reports.title")}</CardTitle>
            <CardDescription>
               {translate("dashboard.routes.reports.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            <PeriodFilterControls />
            <Tabs defaultValue="overview">
               <TabsList>
                  <TabsTrigger value="overview">
                     {translate("dashboard.routes.reports.tabs.overview")}
                  </TabsTrigger>
                  <TabsTrigger value="cashflow">
                     {translate("dashboard.routes.reports.tabs.cashflow")}
                  </TabsTrigger>
                  <TabsTrigger value="categories">
                     {translate("dashboard.routes.reports.tabs.categories")}
                  </TabsTrigger>
                  <TabsTrigger value="performance">
                     {translate("dashboard.routes.reports.tabs.performance")}
                  </TabsTrigger>
               </TabsList>
               <ReportsChartsContent />
            </Tabs>
         </CardContent>
      </Card>
   );
}

export function ReportsListSection() {
   return (
      <ErrorBoundary FallbackComponent={ReportsListErrorFallback}>
         <Suspense fallback={<ReportsListSkeleton />}>
            <ReportsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
