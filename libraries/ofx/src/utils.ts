export const toInt = (val: string): number => Number.parseInt(val, 10);

export const toFloat = (val: string): number => Number.parseFloat(val);

export const toArray = <T>(value: T | T[]): T[] =>
   Array.isArray(value) ? value : [value];

export const pad = (n: number, width = 2): string =>
   n.toString().padStart(width, "0");

export function escapeOfxText(text: string): string {
   if (!text.includes("&") && !text.includes("<") && !text.includes(">")) {
      return text;
   }
   return text.replace(/[&<>]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
   );
}

export function formatAmount(amount: number): string {
   return amount.toFixed(2);
}

export function formatOfxDate(
   date: Date,
   timezone?: { offset: number; name: string },
): string {
   const tz = timezone ?? { name: "GMT", offset: 0 };
   const offsetMs = tz.offset * 60 * 60 * 1000;
   const adjustedDate = new Date(date.getTime() + offsetMs);

   const year = adjustedDate.getUTCFullYear();
   const month = pad(adjustedDate.getUTCMonth() + 1);
   const day = pad(adjustedDate.getUTCDate());
   const hour = pad(adjustedDate.getUTCHours());
   const minute = pad(adjustedDate.getUTCMinutes());
   const second = pad(adjustedDate.getUTCSeconds());

   const sign = tz.offset >= 0 ? "+" : "";
   return `${year}${month}${day}${hour}${minute}${second}[${sign}${tz.offset}:${tz.name}]`;
}
