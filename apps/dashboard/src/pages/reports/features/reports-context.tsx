import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

export type PeriodPreset =
   | "current_month"
   | "last_month"
   | "current_year"
   | "last_year"
   | "custom";

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

interface ReportsContextType {
   startDate: Date;
   endDate: Date;
   preset: PeriodPreset;
   setPreset: (preset: PeriodPreset) => void;
   setPeriod: (start: Date, end: Date) => void;
   setCustomPeriod: (start: Date, end: Date) => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
   const initialDates = getCurrentMonthDates();
   const [startDate, setStartDate] = useState<Date>(initialDates.start);
   const [endDate, setEndDate] = useState<Date>(initialDates.end);
   const [preset, setPresetState] = useState<PeriodPreset>("current_month");

   const setPeriod = useCallback((start: Date, end: Date) => {
      setStartDate(start);
      setEndDate(end);
   }, []);

   const setPreset = useCallback(
      (newPreset: PeriodPreset) => {
         setPresetState(newPreset);
         let dates: { start: Date; end: Date } | undefined;

         const now = new Date();
         switch (newPreset) {
            case "current_month":
               dates = {
                  end: new Date(
                     now.getFullYear(),
                     now.getMonth() + 1,
                     0,
                     23,
                     59,
                     59,
                  ),
                  start: new Date(now.getFullYear(), now.getMonth(), 1),
               };
               break;
            case "last_month":
               dates = {
                  end: new Date(
                     now.getFullYear(),
                     now.getMonth(),
                     0,
                     23,
                     59,
                     59,
                  ),
                  start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
               };
               break;
            case "current_year":
               dates = {
                  end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
                  start: new Date(now.getFullYear(), 0, 1),
               };
               break;
            case "last_year":
               dates = {
                  end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59),
                  start: new Date(now.getFullYear() - 1, 0, 1),
               };
               break;
            default:
               return;
         }

         setPeriod(dates.start, dates.end);
      },
      [setPeriod],
   );

   const setCustomPeriod = useCallback(
      (start: Date, end: Date) => {
         setPresetState("custom");
         setPeriod(start, end);
      },
      [setPeriod],
   );

   const value = {
      endDate,
      preset,
      setCustomPeriod,
      setPeriod,
      setPreset,
      startDate,
   };

   return (
      <ReportsContext.Provider value={value}>
         {children}
      </ReportsContext.Provider>
   );
}

export function useReports() {
   const context = useContext(ReportsContext);
   if (context === undefined) {
      throw new Error("useReports must be used within a ReportsProvider");
   }
   return context;
}
