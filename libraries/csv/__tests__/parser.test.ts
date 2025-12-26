import { describe, expect, test } from "bun:test";
import {
   parse,
   parseBuffer,
   parseBufferOrThrow,
   parseOrThrow,
   parseToArray,
} from "../src/parser";

describe("parseToArray", () => {
   describe("basic parsing", () => {
      test("parses simple CSV", () => {
         const csv = "a,b,c\n1,2,3";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
         ]);
      });

      test("handles empty input", () => {
         const result = parseToArray("");
         expect(result).toEqual([]);
      });

      test("handles single row", () => {
         const csv = "a,b,c";
         const result = parseToArray(csv);
         expect(result).toEqual([["a", "b", "c"]]);
      });

      test("handles trailing newline", () => {
         const csv = "a,b,c\n1,2,3\n";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
         ]);
      });
   });

   describe("quoted fields", () => {
      test("handles quoted fields", () => {
         const csv = '"a","b","c"\n"1","2","3"';
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
         ]);
      });

      test("handles commas in quoted fields", () => {
         const csv = '"a,b",c,d\n"1,2",3,4';
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a,b", "c", "d"],
            ["1,2", "3", "4"],
         ]);
      });

      test("handles escaped quotes (doubled)", () => {
         const csv = '"say ""hello""",b,c';
         const result = parseToArray(csv);
         expect(result).toEqual([['say "hello"', "b", "c"]]);
      });

      test("handles quotes at start and end of field", () => {
         const csv = '"""hello""",b,c';
         const result = parseToArray(csv);
         expect(result).toEqual([['"hello"', "b", "c"]]);
      });
   });

   describe("newlines in quoted fields", () => {
      test("handles LF newlines in quoted fields", () => {
         const csv = '"line1\nline2",b,c';
         const result = parseToArray(csv);
         expect(result).toEqual([["line1\nline2", "b", "c"]]);
      });

      test("handles CRLF newlines in quoted fields", () => {
         const csv = '"line1\r\nline2",b,c';
         const result = parseToArray(csv);
         expect(result).toEqual([["line1\r\nline2", "b", "c"]]);
      });

      test("handles multiple newlines in quoted fields", () => {
         const csv = '"line1\nline2\nline3",b,c';
         const result = parseToArray(csv);
         expect(result).toEqual([["line1\nline2\nline3", "b", "c"]]);
      });
   });

   describe("line endings", () => {
      test("handles LF line endings", () => {
         const csv = "a,b,c\n1,2,3\n4,5,6";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
            ["4", "5", "6"],
         ]);
      });

      test("handles CRLF line endings", () => {
         const csv = "a,b,c\r\n1,2,3\r\n4,5,6";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
            ["4", "5", "6"],
         ]);
      });

      test("handles mixed line endings", () => {
         const csv = "a,b,c\n1,2,3\r\n4,5,6";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
            ["4", "5", "6"],
         ]);
      });
   });

   describe("empty fields", () => {
      test("handles empty fields", () => {
         const csv = "a,,c\n,2,\n,,";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["a", "", "c"],
            ["", "2", ""],
            ["", "", ""],
         ]);
      });

      test("handles quoted empty fields", () => {
         const csv = '"","",""';
         const result = parseToArray(csv);
         expect(result).toEqual([["", "", ""]]);
      });
   });

   describe("custom delimiter", () => {
      test("handles semicolon delimiter", () => {
         const csv = "a;b;c\n1;2;3";
         const result = parseToArray(csv, ";");
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
         ]);
      });

      test("handles tab delimiter", () => {
         const csv = "a\tb\tc\n1\t2\t3";
         const result = parseToArray(csv, "\t");
         expect(result).toEqual([
            ["a", "b", "c"],
            ["1", "2", "3"],
         ]);
      });
   });

   describe("UTF-8 support", () => {
      test("handles UTF-8 characters", () => {
         const csv = "名前,年齢\nタロウ,25\nハナコ,30";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["名前", "年齢"],
            ["タロウ", "25"],
            ["ハナコ", "30"],
         ]);
      });

      test("handles emoji", () => {
         const csv = "greeting,emoji\nhello,👋\nbye,👋";
         const result = parseToArray(csv);
         expect(result).toEqual([
            ["greeting", "emoji"],
            ["hello", "👋"],
            ["bye", "👋"],
         ]);
      });

      test("handles accented characters", () => {
         const csv = "café,naïve,résumé";
         const result = parseToArray(csv);
         expect(result).toEqual([["café", "naïve", "résumé"]]);
      });
   });
});

describe("parseOrThrow", () => {
   test("returns CSVDocument with correct structure", () => {
      const csv = "a,b,c\n1,2,3";
      const result = parseOrThrow(csv);

      expect(result.delimiter).toBe(",");
      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.fields).toEqual(["a", "b", "c"]);
      expect(result.rows[0]?.rowIndex).toBe(0);
   });

   test("handles hasHeaders option", () => {
      const csv = "name,age\nJohn,30\nJane,25";
      const result = parseOrThrow(csv, { hasHeaders: true });

      expect(result.headers).toEqual(["name", "age"]);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.record).toEqual({ name: "John", age: "30" });
      expect(result.rows[1]?.record).toEqual({ name: "Jane", age: "25" });
   });

   test("handles skipRows option", () => {
      const csv = "skip this\na,b,c\n1,2,3";
      const result = parseOrThrow(csv, { skipRows: 1 });

      expect(result.totalRows).toBe(2);
      expect(result.rows[0]?.fields).toEqual(["a", "b", "c"]);
   });

   test("handles trimFields option", () => {
      const csv = " a , b , c \n 1 , 2 , 3 ";
      const result = parseOrThrow(csv, { trimFields: true });

      expect(result.rows[0]?.fields).toEqual(["a", "b", "c"]);
      expect(result.rows[1]?.fields).toEqual(["1", "2", "3"]);
   });

   test("handles custom columns option", () => {
      const csv = "1,2,3\n4,5,6";
      const result = parseOrThrow(csv, { columns: ["x", "y", "z"] });

      expect(result.headers).toEqual(["x", "y", "z"]);
      expect(result.rows[0]?.record).toEqual({ x: "1", y: "2", z: "3" });
   });

   test("auto-detects delimiter", () => {
      const csvComma = "a,b,c\n1,2,3";
      const csvSemicolon = "a;b;c\n1;2;3";

      expect(parseOrThrow(csvComma).delimiter).toBe(",");
      expect(parseOrThrow(csvSemicolon).delimiter).toBe(";");
   });
});

describe("parse", () => {
   test("returns success result on valid input", () => {
      const csv = "a,b,c\n1,2,3";
      const result = parse(csv);

      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data.totalRows).toBe(2);
      }
   });

   test("returns success for empty input", () => {
      const result = parse("");

      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data.totalRows).toBe(0);
      }
   });
});

describe("parseBuffer", () => {
   test("parses UTF-8 buffer", () => {
      const csv = "a,b,c\n1,2,3";
      const buffer = new TextEncoder().encode(csv);
      const result = parseBuffer(buffer);

      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data.rows[0]?.fields).toEqual(["a", "b", "c"]);
      }
   });

   test("handles UTF-8 BOM", () => {
      const csv = "a,b,c\n1,2,3";
      const csvBytes = new TextEncoder().encode(csv);
      const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      const buffer = new Uint8Array(bom.length + csvBytes.length);
      buffer.set(bom);
      buffer.set(csvBytes, bom.length);

      const result = parseBufferOrThrow(buffer);
      expect(result.rows[0]?.fields).toEqual(["a", "b", "c"]);
   });
});

describe("edge cases", () => {
   test("handles JSON in fields", () => {
      const csv = 'id,data\n1,"{""key"": ""value""}"';
      const result = parseOrThrow(csv, { hasHeaders: true });

      expect(result.rows[0]?.record?.data).toBe('{"key": "value"}');
   });

   test("handles very long fields", () => {
      const longValue = "a".repeat(10000);
      const csv = `short,${longValue},short`;
      const result = parseToArray(csv);

      expect(result[0]?.[1]).toBe(longValue);
   });

   test("handles many columns", () => {
      const columns = Array.from({ length: 100 }, (_, i) => `col${i}`);
      const values = Array.from({ length: 100 }, (_, i) => `val${i}`);
      const csv = `${columns.join(",")}\n${values.join(",")}`;

      const result = parseOrThrow(csv, { hasHeaders: true });
      expect(result.headers).toHaveLength(100);
      expect(result.rows[0]?.fields).toHaveLength(100);
   });

   test("handles coordinates/numbers", () => {
      const csv = "lat,lng\n40.7128,-74.0060\n34.0522,-118.2437";
      const result = parseOrThrow(csv, { hasHeaders: true });

      expect(result.rows[0]?.record).toEqual({
         lat: "40.7128",
         lng: "-74.0060",
      });
   });
});
