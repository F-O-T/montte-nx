import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { DeleteBankAccount } from "@/pages/bank-account-details/features/delete-bank-account";

function BankAccountActionsCell({ account }: { account: BankAccount }) {
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);

   return (
      <>
         <div className="flex justify-end">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button aria-label="Actions" size="icon" variant="ghost">
                     <MoreVertical className="size-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                     Gerencie sua conta bancária
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Suspense
                     fallback={
                        <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                     }
                  >
                     <ManageBankAccountSheet asChild bankAccount={account} />
                     <DropdownMenuItem
                        onSelect={(e) => {
                           e.preventDefault();
                           setIsDeleteOpen(true);
                        }}
                     >
                        <Trash2 className="size-4 mr-2" />
                        Excluir conta
                     </DropdownMenuItem>
                  </Suspense>
               </DropdownMenuContent>
            </DropdownMenu>
         </div>
         <DeleteBankAccount
            bankAccount={account}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
         />
      </>
   );
}

export function createBankAccountColumns(): ColumnDef<BankAccount>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const account = row.original;
            return (
               <div className="flex flex-col">
                  <span className="font-medium">{account.name}</span>
               </div>
            );
         },
         enableSorting: true,
         header: "Nome",
      },
      {
         accessorKey: "bank",
         cell: ({ row }) => {
            return <span>{row.getValue("bank")}</span>;
         },
         enableSorting: true,
         header: "Banco",
      },
      {
         accessorKey: "type",
         cell: ({ row }) => {
            const type = row.getValue("type") as string;
            const typeMap = {
               checking: "Conta corrente",
               investment: "Conta de investimento",
               savings: "Conta poupança",
            };
            return <span>{typeMap[type as keyof typeof typeMap] || type}</span>;
         },
         enableSorting: true,
         header: "Tipo",
      },
      {
         accessorKey: "status",
         cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
               <Badge variant={status === "active" ? "default" : "secondary"}>
                  {status === "active" ? "Ativa" : "Inativa"}
               </Badge>
            );
         },
         enableSorting: true,
         header: "Status",
      },
      {
         accessorKey: "createdAt",
         cell: ({ row }) => {
            return new Date(row.getValue("createdAt")).toLocaleDateString(
               "pt-BR",
               {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
               },
            );
         },
         enableSorting: true,
         header: "Criado em",
      },
      {
         cell: ({ row }) => <BankAccountActionsCell account={row.original} />,
         header: "",
         id: "actions",
      },
   ];
}
