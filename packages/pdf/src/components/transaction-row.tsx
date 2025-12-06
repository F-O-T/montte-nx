import type { TransactionSnapshot } from "@packages/database/schemas/custom-reports";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

type TransactionRowProps = {
   transaction: TransactionSnapshot;
};

type TransactionsListProps = {
   transactions: TransactionSnapshot[];
};

const styles = StyleSheet.create({
   amountCellNegative: {
      color: "#dc2626",
      fontSize: 8,
      textAlign: "right",
      width: "15%",
   },
   amountCellPositive: {
      color: "#16a34a",
      fontSize: 8,
      textAlign: "right",
      width: "15%",
   },
   categoryBadge: {
      backgroundColor: "#e5e7eb",
      borderRadius: 2,
      marginRight: 2,
      paddingHorizontal: 4,
      paddingVertical: 2,
   },
   categoryCell: {
      color: "#374151",
      fontSize: 8,
      width: "20%",
   },
   categoryText: {
      color: "#374151",
      fontSize: 7,
   },
   container: {
      marginBottom: 20,
   },
   costCenterCell: {
      color: "#6b7280",
      fontSize: 8,
      width: "15%",
   },
   dateCell: {
      color: "#374151",
      fontSize: 8,
      width: "12%",
   },
   descCell: {
      color: "#374151",
      fontSize: 8,
      width: "28%",
   },
   headerCell: {
      color: "#374151",
      fontSize: 8,
      fontWeight: "bold",
      textTransform: "uppercase",
   },
   headerRow: {
      backgroundColor: "#f3f4f6",
      borderBottomColor: "#e5e7eb",
      borderBottomWidth: 1,
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 8,
   },
   noData: {
      color: "#9ca3af",
      fontSize: 10,
      padding: 20,
      textAlign: "center",
   },
   row: {
      borderBottomColor: "#f3f4f6",
      borderBottomWidth: 1,
      flexDirection: "row",
      paddingHorizontal: 10,
      paddingVertical: 6,
   },
   table: {
      borderColor: "#e5e7eb",
      borderRadius: 4,
      borderWidth: 1,
   },
   tagsCell: {
      color: "#9ca3af",
      fontSize: 7,
      width: "10%",
   },
   title: {
      color: "#111827",
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 10,
   },
});

function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
      currency: "BRL",
      style: "currency",
   }).format(Math.abs(value));
}

function formatDate(dateStr: string): string {
   return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
   });
}

export function TransactionRow({ transaction }: TransactionRowProps) {
   const isIncome = transaction.type === "income";
   const categoryNames = transaction.categories.map((c) => c.name).join(", ");
   const tagNames = transaction.tags.map((t) => t.name).join(", ");

   return (
      <View style={styles.row}>
         <Text style={styles.dateCell}>{formatDate(transaction.date)}</Text>
         <Text style={styles.descCell}>
            {transaction.description.substring(0, 35)}
            {transaction.description.length > 35 ? "..." : ""}
         </Text>
         <Text
            style={
               isIncome ? styles.amountCellPositive : styles.amountCellNegative
            }
         >
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
         </Text>
         <Text style={styles.categoryCell}>
            {categoryNames.substring(0, 20)}
            {categoryNames.length > 20 ? "..." : ""}
         </Text>
         <Text style={styles.costCenterCell}>
            {transaction.costCenter?.name?.substring(0, 15) || "-"}
         </Text>
         <Text style={styles.tagsCell}>
            {tagNames.substring(0, 15)}
            {tagNames.length > 15 ? "..." : ""}
         </Text>
      </View>
   );
}

export function TransactionsList({ transactions }: TransactionsListProps) {
   return (
      <View style={styles.container}>
         <Text style={styles.title}>Transações ({transactions.length})</Text>

         <View style={styles.table}>
            <View style={styles.headerRow}>
               <Text style={[styles.headerCell, { width: "12%" }]}>Data</Text>
               <Text style={[styles.headerCell, { width: "28%" }]}>
                  Descrição
               </Text>
               <Text
                  style={[
                     styles.headerCell,
                     { textAlign: "right", width: "15%" },
                  ]}
               >
                  Valor
               </Text>
               <Text style={[styles.headerCell, { width: "20%" }]}>
                  Categoria
               </Text>
               <Text style={[styles.headerCell, { width: "15%" }]}>
                  Centro de Custo
               </Text>
               <Text style={[styles.headerCell, { width: "10%" }]}>Tags</Text>
            </View>

            {transactions.length === 0 && (
               <Text style={styles.noData}>Nenhuma transação encontrada</Text>
            )}

            {transactions.map((transaction, index) => (
               <TransactionRow key={index} transaction={transaction} />
            ))}
         </View>
      </View>
   );
}
