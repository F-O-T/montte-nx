import type React from "react";
import {
   createContext,
   useCallback,
   useContext,
   useMemo,
   useState,
} from "react";

type StatusFilter = "active" | "inactive" | "all";
type MonetaryCorrectionFilter = "ipca" | "selic" | "cdi" | "none" | "all";
type InterestTypeFilter = "daily" | "monthly" | "none" | "all";
type PenaltyTypeFilter = "percentage" | "fixed" | "none" | "all";
type OrderBy = "name" | "createdAt" | "updatedAt";

interface InterestTemplateListContextType {
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
   statusFilter: StatusFilter;
   setStatusFilter: (value: StatusFilter) => void;
   monetaryCorrectionFilter: MonetaryCorrectionFilter;
   setMonetaryCorrectionFilter: (value: MonetaryCorrectionFilter) => void;
   interestTypeFilter: InterestTypeFilter;
   setInterestTypeFilter: (value: InterestTypeFilter) => void;
   penaltyTypeFilter: PenaltyTypeFilter;
   setPenaltyTypeFilter: (value: PenaltyTypeFilter) => void;
   isDefaultFilter: boolean | null;
   setIsDefaultFilter: (value: boolean | null) => void;
   searchTerm: string;
   setSearchTerm: (value: string) => void;

   // Date range filters
   startDate: Date | null;
   setStartDate: (date: Date | null) => void;
   endDate: Date | null;
   setEndDate: (date: Date | null) => void;

   // Filter utilities
   clearFilters: () => void;
   hasActiveFilters: boolean;
}

const InterestTemplateListContext = createContext<
   InterestTemplateListContextType | undefined
>(undefined);

export function InterestTemplateListProvider({
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
   const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
   const [monetaryCorrectionFilter, setMonetaryCorrectionFilter] =
      useState<MonetaryCorrectionFilter>("all");
   const [interestTypeFilter, setInterestTypeFilter] =
      useState<InterestTypeFilter>("all");
   const [penaltyTypeFilter, setPenaltyTypeFilter] =
      useState<PenaltyTypeFilter>("all");
   const [isDefaultFilter, setIsDefaultFilter] = useState<boolean | null>(null);
   const [searchTerm, setSearchTerm] = useState("");

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
         statusFilter !== "active" ||
         monetaryCorrectionFilter !== "all" ||
         interestTypeFilter !== "all" ||
         penaltyTypeFilter !== "all" ||
         isDefaultFilter !== null ||
         searchTerm !== "" ||
         startDate !== null ||
         endDate !== null
      );
   }, [
      statusFilter,
      monetaryCorrectionFilter,
      interestTypeFilter,
      penaltyTypeFilter,
      isDefaultFilter,
      searchTerm,
      startDate,
      endDate,
   ]);

   // Clear all filters
   const clearFilters = useCallback(() => {
      setStatusFilter("active");
      setMonetaryCorrectionFilter("all");
      setInterestTypeFilter("all");
      setPenaltyTypeFilter("all");
      setIsDefaultFilter(null);
      setSearchTerm("");
      setStartDate(null);
      setEndDate(null);
      setCurrentPage(1);
   }, []);

   // Filter setters with auto-reset pagination
   const handleStatusFilterChange = useCallback((value: StatusFilter) => {
      setStatusFilter(value);
      setCurrentPage(1);
   }, []);

   const handleMonetaryCorrectionFilterChange = useCallback(
      (value: MonetaryCorrectionFilter) => {
         setMonetaryCorrectionFilter(value);
         setCurrentPage(1);
      },
      [],
   );

   const handleInterestTypeFilterChange = useCallback(
      (value: InterestTypeFilter) => {
         setInterestTypeFilter(value);
         setCurrentPage(1);
      },
      [],
   );

   const handlePenaltyTypeFilterChange = useCallback(
      (value: PenaltyTypeFilter) => {
         setPenaltyTypeFilter(value);
         setCurrentPage(1);
      },
      [],
   );

   const handleIsDefaultFilterChange = useCallback((value: boolean | null) => {
      setIsDefaultFilter(value);
      setCurrentPage(1);
   }, []);

   const handleSearchTermChange = useCallback((value: string) => {
      setSearchTerm(value);
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

   const value: InterestTemplateListContextType = {
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
      statusFilter,
      setStatusFilter: handleStatusFilterChange,
      monetaryCorrectionFilter,
      setMonetaryCorrectionFilter: handleMonetaryCorrectionFilterChange,
      interestTypeFilter,
      setInterestTypeFilter: handleInterestTypeFilterChange,
      penaltyTypeFilter,
      setPenaltyTypeFilter: handlePenaltyTypeFilterChange,
      isDefaultFilter,
      setIsDefaultFilter: handleIsDefaultFilterChange,
      searchTerm,
      setSearchTerm: handleSearchTermChange,

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
      <InterestTemplateListContext.Provider value={value}>
         {children}
      </InterestTemplateListContext.Provider>
   );
}

export function useInterestTemplateList() {
   const context = useContext(InterestTemplateListContext);
   if (context === undefined) {
      throw new Error(
         "useInterestTemplateList must be used within a InterestTemplateListProvider",
      );
   }
   return context;
}
