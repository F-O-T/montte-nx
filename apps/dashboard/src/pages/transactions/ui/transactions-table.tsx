import { Badge } from "@packages/ui/components/badge";
import { Card, CardContent } from "@packages/ui/components/card";
import {
   Combobox,
   type ComboboxOption,
} from "@packages/ui/components/combobox";
import { Input } from "@packages/ui/components/input";
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "./transactions-page";

function TransactionCard({ transaction }: { transaction: Transaction }) {
   return (
      <Card className="mb-4">
         <CardContent className="p-4">
            <div className="flex items-start justify-between">
               <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <h3 className="font-medium text-sm">
                        {transaction.description}
                     </h3>
                     <Badge
                        className="text-xs"
                        variant={
                           transaction.status === "completed"
                              ? "default"
                              : "secondary"
                        }
                     >
                        {transaction.status}
                     </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                     <Badge className="text-xs font-normal" variant="outline">
                        {transaction.category}
                     </Badge>
                     <span className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                     </span>
                  </div>
               </div>
               <div className="flex items-center ml-4">
                  {transaction.type === "income" ? (
                     <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                     <ArrowDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                     className={`font-mono font-medium text-sm ${
                        transaction.type === "income"
                           ? "text-green-600"
                           : "text-red-600"
                     }`}
                  >
                     ${Math.abs(transaction.amount).toFixed(2)}
                  </span>
               </div>
            </div>
         </CardContent>
      </Card>
   );
}

interface TransactionsTableProps {
   transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
   const [searchTerm, setSearchTerm] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   const filteredTransactions = transactions.filter((transaction) => {
      const matchesSearch =
         transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
         categoryFilter === "all" || transaction.category === categoryFilter;
      const matchesType =
         typeFilter === "all" || transaction.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
   });

   // Pagination logic
   const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      startIndex + itemsPerPage,
   );

   // Reset to first page when filters change
   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const categories = Array.from(new Set(transactions.map((t) => t.category)));

   const categoryOptions: ComboboxOption[] = [
      { label: "All Categories", value: "all" },
      ...categories.map((category) => ({ label: category, value: category })),
   ];

   return (
      <Card className="shadow-sm">
         <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
               <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                     className="pl-10 h-10"
                     onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleFilterChange();
                     }}
                     placeholder="Search transactions..."
                     value={searchTerm}
                  />
               </div>
               <div className="flex gap-3">
                  <Combobox
                     className="w-48"
                     emptyMessage="No categories found."
                     onValueChange={(value) => {
                        setCategoryFilter(value);
                        handleFilterChange();
                     }}
                     options={categoryOptions}
                     placeholder="All Categories"
                     searchPlaceholder="Search categories..."
                     value={categoryFilter}
                  />
                  <Select
                     onValueChange={(value) => {
                        setTypeFilter(value);
                        handleFilterChange();
                     }}
                     value={typeFilter}
                  >
                     <SelectTrigger className="w-36 h-10">
                        <SelectValue placeholder="All Types" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
               <Table>
                  <TableHeader>
                     <TableRow className="hover:bg-muted/50">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">
                           Description
                        </TableHead>
                        <TableHead className="font-semibold">
                           Category
                        </TableHead>
                        <TableHead className="font-semibold">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {paginatedTransactions.map((transaction) => (
                        <TableRow
                           className="hover:bg-muted/30"
                           key={transaction.id}
                        >
                           <TableCell className="font-medium">
                              {new Date(transaction.date).toLocaleDateString()}
                           </TableCell>
                           <TableCell
                              className="max-w-xs truncate"
                              title={transaction.description}
                           >
                              {transaction.description}
                           </TableCell>
                           <TableCell>
                              <Badge className="font-normal" variant="outline">
                                 {transaction.category}
                              </Badge>
                           </TableCell>
                           <TableCell className="font-mono font-medium">
                              <div className="flex items-center">
                                 {transaction.type === "income" ? (
                                    <ArrowUp className="h-4 w-4 text-green-600 mr-2" />
                                 ) : (
                                    <ArrowDown className="h-4 w-4 text-red-600 mr-2" />
                                 )}
                                 <span
                                    className={
                                       transaction.type === "income"
                                          ? "text-green-600"
                                          : "text-red-600"
                                    }
                                 >
                                    ${Math.abs(transaction.amount).toFixed(2)}
                                 </span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge
                                 className="font-normal"
                                 variant={
                                    transaction.status === "completed"
                                       ? "default"
                                       : "secondary"
                                 }
                              >
                                 {transaction.status}
                              </Badge>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-2">
               {paginatedTransactions.map((transaction) => (
                  <TransactionCard
                     key={transaction.id}
                     transaction={transaction}
                  />
               ))}
            </div>

            {totalPages > 1 && (
               <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                     Showing {startIndex + 1} to{" "}
                     {Math.min(
                        startIndex + itemsPerPage,
                        filteredTransactions.length,
                     )}{" "}
                     of {filteredTransactions.length} transactions
                  </p>
                  <Pagination>
                     <PaginationContent>
                        <PaginationItem>
                           <PaginationPrevious
                              className={
                                 currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                              }
                              onClick={() =>
                                 setCurrentPage(Math.max(1, currentPage - 1))
                              }
                           />
                        </PaginationItem>
                        {Array.from(
                           { length: totalPages },
                           (_, i) => i + 1,
                        ).map((page) => (
                           <PaginationItem key={page}>
                              <PaginationLink
                                 className="cursor-pointer"
                                 isActive={currentPage === page}
                                 onClick={() => setCurrentPage(page)}
                              >
                                 {page}
                              </PaginationLink>
                           </PaginationItem>
                        ))}
                        <PaginationItem>
                           <PaginationNext
                              className={
                                 currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                              }
                              onClick={() =>
                                 setCurrentPage(
                                    Math.min(totalPages, currentPage + 1),
                                 )
                              }
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </div>
            )}
         </CardContent>
      </Card>
   );
}
