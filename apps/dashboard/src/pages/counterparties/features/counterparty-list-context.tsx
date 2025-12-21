import type React from "react";
import {
   createContext,
   useCallback,
   useContext,
   useMemo,
   useState,
} from "react";

type CounterpartyType = "client" | "supplier" | "both" | "all";
type StatusFilter = "active" | "inactive" | "all";
type OrderBy = "name" | "type" | "createdAt" | "updatedAt" | "tradeName" | "legalName";

interface CounterpartyListContextType {
   // Selection
   selectedItems: Set<string>;
   handleSelectionChange: (id: string, selected: boolean) => void;
   clearSelection: () => void;
   selectAll: (ids: string[]) => void;
   toggleAll: (ids: string[]) => void;
   selectedCount: number;

   // Ordering
   orderBy: OrderBy;
   setOrderBy: (value: OrderBy) => void;
   orderDirection: "asc" | "desc";
   setOrderDirection: (value: "asc" | "desc") => void;

   // Pagination
   currentPage: number;
   setCurrentPage: (page: number) => void;
   pageSize: number;
   setPageSize: (size: number) => void;

   // Filters
   typeFilter: CounterpartyType;
   setTypeFilter: (value: CounterpartyType) => void;
   statusFilter: StatusFilter;
   setStatusFilter: (value: StatusFilter) => void;
   searchTerm: string;
   setSearchTerm: (value: string) => void;
   industryFilter: string;
   setIndustryFilter: (value: string) => void;

   // Date range filters
   startDate: Date | null;
   setStartDate: (date: Date | null) => void;
   endDate: Date | null;
   setEndDate: (date: Date | null) => void;

   // Filter utilities
   clearFilters: () => void;
   hasActiveFilters: boolean;
}

const CounterpartyListContext = createContext<
   CounterpartyListContextType | undefined
>(undefined);

export function CounterpartyListProvider({
   children,
}: {
   children: React.ReactNode;
}) {
   // Selection state
   const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

   // Ordering state
   const [orderBy, setOrderBy] = useState<OrderBy>("name");
   const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc");

   // Pagination state
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   // Filter state
   const [typeFilter, setTypeFilter] = useState<CounterpartyType>("all");
   const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
   const [searchTerm, setSearchTerm] = useState("");
   const [industryFilter, setIndustryFilter] = useState("all");

   // Date range state
   const [startDate, setStartDate] = useState<Date | null>(null);
   const [endDate, setEndDate] = useState<Date | null>(null);

   // Selection handlers
   const handleSelectionChange = useCallback(
      (id: string, selected: boolean) => {
         setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (selected) {
               newSet.add(id);
            } else {
               newSet.delete(id);
            }
            return newSet;
         });
      },
      [],
   );

   const clearSelection = useCallback(() => {
      setSelectedItems(new Set());
   }, []);

   const selectAll = useCallback((ids: string[]) => {
      setSelectedItems(new Set(ids));
   }, []);

   const toggleAll = useCallback((ids: string[]) => {
      setSelectedItems((prev) => {
         const allSelected = ids.every((id) => prev.has(id));
         return allSelected ? new Set() : new Set(ids);
      });
   }, []);

   // Check if any filters are active
   const hasActiveFilters = useMemo(() => {
      return (
         typeFilter !== "all" ||
         statusFilter !== "active" ||
         searchTerm !== "" ||
         industryFilter !== "all" ||
         startDate !== null ||
         endDate !== null
      );
   }, [typeFilter, statusFilter, searchTerm, industryFilter, startDate, endDate]);

   // Clear all filters
   const clearFilters = useCallback(() => {
      setTypeFilter("all");
      setStatusFilter("active");
      setSearchTerm("");
      setIndustryFilter("all");
      setStartDate(null);
      setEndDate(null);
      setCurrentPage(1);
   }, []);

   // Reset page when filters change
   const handleTypeFilterChange = useCallback((value: CounterpartyType) => {
      setTypeFilter(value);
      setCurrentPage(1);
   }, []);

   const handleStatusFilterChange = useCallback((value: StatusFilter) => {
      setStatusFilter(value);
      setCurrentPage(1);
   }, []);

   const handleSearchTermChange = useCallback((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
   }, []);

   const handleIndustryFilterChange = useCallback((value: string) => {
      setIndustryFilter(value);
      setCurrentPage(1);
   }, []);

   const handleStartDateChange = useCallback((date: Date | null) => {
      setStartDate(date);
      setCurrentPage(1);
   }, []);

   const handleEndDateChange = useCallback((date: Date | null) => {
      setEndDate(date);
      setCurrentPage(1);
   }, []);

   const value: CounterpartyListContextType = {
      // Selection
      selectedItems,
      handleSelectionChange,
      clearSelection,
      selectAll,
      toggleAll,
      selectedCount: selectedItems.size,

      // Ordering
      orderBy,
      setOrderBy,
      orderDirection,
      setOrderDirection,

      // Pagination
      currentPage,
      setCurrentPage,
      pageSize,
      setPageSize,

      // Filters
      typeFilter,
      setTypeFilter: handleTypeFilterChange,
      statusFilter,
      setStatusFilter: handleStatusFilterChange,
      searchTerm,
      setSearchTerm: handleSearchTermChange,
      industryFilter,
      setIndustryFilter: handleIndustryFilterChange,

      // Date range
      startDate,
      setStartDate: handleStartDateChange,
      endDate,
      setEndDate: handleEndDateChange,

      // Utilities
      clearFilters,
      hasActiveFilters,
   };

   return (
      <CounterpartyListContext.Provider value={value}>
         {children}
      </CounterpartyListContext.Provider>
   );
}

export function useCounterpartyList() {
   const context = useContext(CounterpartyListContext);
   if (context === undefined) {
      throw new Error(
         "useCounterpartyList must be used within a CounterpartyListProvider",
      );
   }
   return context;
}
