import { describe, expect, it } from "bun:test";
import {
   escapeOfxText,
   formatAmount,
   formatOfxDate,
   pad,
   toArray,
   toFloat,
   toInt,
} from "../src/utils";

describe("toInt", () => {
   it("parses positive integers", () => {
      expect(toInt("123")).toBe(123);
   });

   it("parses negative integers", () => {
      expect(toInt("-456")).toBe(-456);
   });

   it("parses zero", () => {
      expect(toInt("0")).toBe(0);
   });

   it("parses leading zeros", () => {
      expect(toInt("007")).toBe(7);
   });

   it("returns NaN for non-numeric strings", () => {
      expect(toInt("abc")).toBeNaN();
   });

   it("parses empty string as NaN", () => {
      expect(toInt("")).toBeNaN();
   });

   it("truncates decimal values", () => {
      expect(toInt("123.99")).toBe(123);
   });
});

describe("toFloat", () => {
   it("parses positive floats", () => {
      expect(toFloat("123.45")).toBe(123.45);
   });

   it("parses negative floats", () => {
      expect(toFloat("-67.89")).toBe(-67.89);
   });

   it("parses zero", () => {
      expect(toFloat("0.0")).toBe(0);
   });

   it("parses integers as floats", () => {
      expect(toFloat("100")).toBe(100);
   });

   it("parses scientific notation", () => {
      expect(toFloat("1.5e2")).toBe(150);
   });

   it("returns NaN for non-numeric strings", () => {
      expect(toFloat("xyz")).toBeNaN();
   });

   it("parses negative zero as equivalent to zero", () => {
      const result = toFloat("-0.00");
      expect(result === 0).toBe(true);
   });
});

describe("toArray", () => {
   it("wraps single value in array", () => {
      expect(toArray("single")).toEqual(["single"]);
   });

   it("returns array unchanged", () => {
      const arr = [1, 2, 3];
      expect(toArray(arr)).toBe(arr);
   });

   it("wraps null in array", () => {
      expect(toArray(null)).toEqual([null]);
   });

   it("wraps undefined in array", () => {
      expect(toArray(undefined)).toEqual([undefined]);
   });

   it("wraps object in array", () => {
      const obj = { key: "value" };
      expect(toArray(obj)).toEqual([obj]);
   });

   it("returns empty array unchanged", () => {
      const arr: unknown[] = [];
      expect(toArray(arr)).toBe(arr);
   });

   it("wraps number in array", () => {
      expect(toArray(42)).toEqual([42]);
   });
});

describe("pad", () => {
   it("pads single digit to two digits", () => {
      expect(pad(5)).toBe("05");
   });

   it("does not pad two digit number", () => {
      expect(pad(12)).toBe("12");
   });

   it("pads zero", () => {
      expect(pad(0)).toBe("00");
   });

   it("pads with custom width", () => {
      expect(pad(7, 4)).toBe("0007");
   });

   it("does not truncate larger numbers", () => {
      expect(pad(123, 2)).toBe("123");
   });

   it("pads to width of 1", () => {
      expect(pad(0, 1)).toBe("0");
   });
});

describe("escapeOfxText", () => {
   it("escapes ampersand", () => {
      expect(escapeOfxText("Tom & Jerry")).toBe("Tom &amp; Jerry");
   });

   it("escapes less than", () => {
      expect(escapeOfxText("a < b")).toBe("a &lt; b");
   });

   it("escapes greater than", () => {
      expect(escapeOfxText("a > b")).toBe("a &gt; b");
   });

   it("escapes multiple special characters", () => {
      expect(escapeOfxText("<Tom & Jerry>")).toBe("&lt;Tom &amp; Jerry&gt;");
   });

   it("returns unchanged string without special chars", () => {
      expect(escapeOfxText("Hello World")).toBe("Hello World");
   });

   it("handles empty string", () => {
      expect(escapeOfxText("")).toBe("");
   });

   it("escapes multiple ampersands", () => {
      expect(escapeOfxText("a & b & c")).toBe("a &amp; b &amp; c");
   });
});

describe("formatAmount", () => {
   it("formats integer to two decimal places", () => {
      expect(formatAmount(100)).toBe("100.00");
   });

   it("formats negative amount", () => {
      expect(formatAmount(-50)).toBe("-50.00");
   });

   it("formats zero", () => {
      expect(formatAmount(0)).toBe("0.00");
   });

   it("rounds to two decimal places", () => {
      expect(formatAmount(99.999)).toBe("100.00");
   });

   it("preserves existing two decimal places", () => {
      expect(formatAmount(123.45)).toBe("123.45");
   });

   it("extends single decimal to two", () => {
      expect(formatAmount(75.5)).toBe("75.50");
   });
});

describe("formatOfxDate", () => {
   it("formats date with default GMT timezone", () => {
      const date = new Date(Date.UTC(2023, 11, 15, 12, 30, 45));
      expect(formatOfxDate(date)).toBe("20231215123045[+0:GMT]");
   });

   it("formats date with positive timezone offset", () => {
      const date = new Date(Date.UTC(2023, 0, 1, 0, 0, 0));
      expect(formatOfxDate(date, { name: "BRT", offset: 3 })).toBe(
         "20230101030000[+3:BRT]",
      );
   });

   it("formats date with negative timezone offset", () => {
      const date = new Date(Date.UTC(2023, 6, 4, 18, 0, 0));
      expect(formatOfxDate(date, { name: "EST", offset: -5 })).toBe(
         "20230704130000[-5:EST]",
      );
   });

   it("handles midnight correctly", () => {
      const date = new Date(Date.UTC(2023, 5, 15, 0, 0, 0));
      expect(formatOfxDate(date)).toBe("20230615000000[+0:GMT]");
   });

   it("pads single digit month and day", () => {
      const date = new Date(Date.UTC(2023, 0, 5, 9, 5, 3));
      expect(formatOfxDate(date)).toBe("20230105090503[+0:GMT]");
   });

   it("handles year boundary", () => {
      const date = new Date(Date.UTC(2023, 11, 31, 23, 59, 59));
      expect(formatOfxDate(date)).toBe("20231231235959[+0:GMT]");
   });
});
