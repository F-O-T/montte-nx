import { StyleSheet, Text, View } from "@react-pdf/renderer";

type SummaryCardProps = {
   label: string;
   value: string;
   color?: string;
};

type SummaryCardsProps = {
   cards: SummaryCardProps[];
};

const styles = StyleSheet.create({
   card: {
      backgroundColor: "#f9fafb",
      borderLeft: "3 solid #2563eb",
      borderRadius: 6,
      flex: 1,
      padding: 12,
   },
   container: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 20,
   },
   label: {
      color: "#6b7280",
      fontSize: 9,
      marginBottom: 4,
      textTransform: "uppercase",
   },
   value: {
      color: "#111827",
      fontSize: 14,
      fontWeight: "bold",
   },
});

export function SummaryCard({
   label,
   value,
   color = "#2563eb",
}: SummaryCardProps) {
   return (
      <View style={[styles.card, { borderLeftColor: color }]}>
         <Text style={styles.label}>{label}</Text>
         <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
   );
}

export function SummaryCards({ cards }: SummaryCardsProps) {
   return (
      <View style={styles.container}>
         {cards.map((card, index) => (
            <SummaryCard key={index} {...card} />
         ))}
      </View>
   );
}
