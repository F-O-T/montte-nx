import { StyleSheet, Text, View } from "@react-pdf/renderer";

type HeaderProps = {
   title: string;
   subtitle?: string;
   reportType: string;
};

const styles = StyleSheet.create({
   badge: {
      alignSelf: "flex-start",
      backgroundColor: "#2563eb",
      borderRadius: 4,
      color: "#ffffff",
      fontSize: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
   },
   container: {
      borderBottom: "1 solid #e5e7eb",
      marginBottom: 20,
      paddingBottom: 15,
   },
   subtitle: {
      color: "#6b7280",
      fontSize: 12,
      marginBottom: 4,
   },
   title: {
      color: "#111827",
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 4,
   },
});

export function Header({ title, subtitle, reportType }: HeaderProps) {
   const typeLabel =
      reportType === "dre_gerencial" ? "DRE Gerencial" : "DRE Fiscal";

   return (
      <View style={styles.container}>
         <Text style={styles.badge}>{typeLabel}</Text>
         <Text style={styles.title}>{title}</Text>
         {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
   );
}
