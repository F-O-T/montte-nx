"use client";

import {
   type ColumnDef,
   type ColumnFiltersState,
   flexRender,
   getCoreRowModel,
   getFilteredRowModel,
   getSortedRowModel,
   type SortingState,
   useReactTable,
   type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "./button";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "./table";

interface DataTableProps<TData, TValue> {
   columns: ColumnDef<TData, TValue>[];
   data: TData[];
}

export function DataTable<TData, TValue>({
   columns,
   data,
}: DataTableProps<TData, TValue>) {
   const [sorting, setSorting] = useState<SortingState>([]);
   const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
   const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
      {},
   );
   const [rowSelection, setRowSelection] = useState({});

   const table = useReactTable({
      columns,
      data,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getSortedRowModel: getSortedRowModel(),
      onColumnFiltersChange: setColumnFilters,
      onColumnVisibilityChange: setColumnVisibility,
      onRowSelectionChange: setRowSelection,
      onSortingChange: setSorting,
      state: {
         columnFilters,
         columnVisibility,
         rowSelection,
         sorting,
      },
      // Removido initialState com pagination
   });

   return (
      <div className="w-full space-y-4">
         <div className="rounded-md border">
            <Table>
               <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                     <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                           return (
                              <TableHead key={header.id}>
                                 {header.isPlaceholder ? null : header.column.getCanSort() ? (
                                    <Button
                                       className="-ml-3 h-8"
                                       onClick={header.column.getToggleSortingHandler()}
                                       variant="ghost"
                                    >
                                       {flexRender(
                                          header.column.columnDef.header,
                                          header.getContext(),
                                       )}
                                       {header.column.getIsSorted() ===
                                          "asc" ? (
                                          <ArrowUp className="ml-2 size-4" />
                                       ) : header.column.getIsSorted() ===
                                          "desc" ? (
                                          <ArrowDown className="ml-2 size-4" />
                                       ) : (
                                          <ArrowUpDown className="ml-2 size-4" />
                                       )}
                                    </Button>
                                 ) : (
                                    flexRender(
                                       header.column.columnDef.header,
                                       header.getContext(),
                                    )
                                 )}
                              </TableHead>
                           );
                        })}
                     </TableRow>
                  ))}
               </TableHeader>
               <TableBody>
                  {table.getRowModel().rows?.length ? (
                     table.getRowModel().rows.map((row) => (
                        <TableRow
                           data-state={row.getIsSelected() && "selected"}
                           key={row.id}
                        >
                           {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="truncate">
                                 {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                 )}
                              </TableCell>
                           ))}
                        </TableRow>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell
                           className="h-24 text-center"
                           colSpan={columns.length}
                        >
                           Nenhum resultado encontrado.
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
   );
}
