import { describe, expect, test } from "bun:test";
import {
   createGenerator,
   generate,
   generateFromObjects,
   generateRow,
} from "../src/generator";
import { parseToArray } from "../src/parser";

describe("generate", () => {
   test("generates simple CSV", () => {
      const rows = [
         ["a", "b", "c"],
         ["1", "2", "3"],
      ];
      const result = generate(rows);
      expect(result).toBe("a,b,c\n1,2,3");
   });

   test("handles empty input", () => {
      const result = generate([]);
      expect(result).toBe("");
   });

   test("escapes fields with commas", () => {
      const rows = [["a,b", "c", "d"]];
      const result = generate(rows);
      expect(result).toBe('"a,b",c,d');
   });

   test("escapes fields with quotes", () => {
      const rows = [['say "hello"', "b", "c"]];
      const result = generate(rows);
      expect(result).toBe('"say ""hello""",b,c');
   });

   test("escapes fields with newlines", () => {
      const rows = [["line1\nline2", "b", "c"]];
      const result = generate(rows);
      expect(result).toBe('"line1\nline2",b,c');
   });

   test("respects custom delimiter", () => {
      const rows = [
         ["a", "b", "c"],
         ["1", "2", "3"],
      ];
      const result = generate(rows, { delimiter: ";" });
      expect(result).toBe("a;b;c\n1;2;3");
   });

   test("respects CRLF line ending", () => {
      const rows = [
         ["a", "b", "c"],
         ["1", "2", "3"],
      ];
      const result = generate(rows, { lineEnding: "\r\n" });
      expect(result).toBe("a,b,c\r\n1,2,3");
   });

   test("respects alwaysQuote option", () => {
      const rows = [["a", "b", "c"]];
      const result = generate(rows, { alwaysQuote: true });
      expect(result).toBe('"a","b","c"');
   });

   test("roundtrips with parser", () => {
      const original = [
         ["name", "value", "note"],
         ["test", "123", "a,b,c"],
         ['say "hi"', "456", "line1\nline2"],
      ];

      const csv = generate(original);
      const parsed = parseToArray(csv);

      expect(parsed).toEqual(original);
   });
});

describe("generateFromObjects", () => {
   test("generates CSV from objects", () => {
      const data = [
         { name: "John", age: "30" },
         { name: "Jane", age: "25" },
      ];
      const result = generateFromObjects(data);
      expect(result).toBe("name,age\nJohn,30\nJane,25");
   });

   test("handles empty array", () => {
      const result = generateFromObjects([]);
      expect(result).toBe("");
   });

   test("handles custom headers", () => {
      const data = [
         { name: "John", age: 30, city: "NYC" },
         { name: "Jane", age: 25, city: "LA" },
      ];
      const result = generateFromObjects(data, { headers: ["name", "city"] });
      expect(result).toBe("name,city\nJohn,NYC\nJane,LA");
   });

   test("handles includeHeaders false", () => {
      const data = [
         { name: "John", age: "30" },
         { name: "Jane", age: "25" },
      ];
      const result = generateFromObjects(data, { includeHeaders: false });
      expect(result).toBe("John,30\nJane,25");
   });

   test("handles null and undefined values", () => {
      const data = [{ name: "John", value: null }, { name: "Jane" }] as Record<
         string,
         unknown
      >[];
      const result = generateFromObjects(data, { headers: ["name", "value"] });
      expect(result).toBe("name,value\nJohn,\nJane,");
   });

   test("handles Date objects", () => {
      const date = new Date("2023-12-15T00:00:00.000Z");
      const data = [{ date }];
      const result = generateFromObjects(data);
      expect(result).toBe("date\n2023-12-15T00:00:00.000Z");
   });

   test("handles nested objects as JSON", () => {
      const data = [{ nested: { key: "value" } }];
      const result = generateFromObjects(data);
      expect(result).toBe('nested\n"{""key"":""value""}"');
   });
});

describe("generateRow", () => {
   test("generates single row", () => {
      const result = generateRow(["a", "b", "c"]);
      expect(result).toBe("a,b,c");
   });

   test("escapes special characters", () => {
      const result = generateRow(["a,b", 'say "hi"', "test"]);
      expect(result).toBe('"a,b","say ""hi""",test');
   });

   test("respects custom delimiter", () => {
      const result = generateRow(["a", "b", "c"], { delimiter: ";" });
      expect(result).toBe("a;b;c");
   });
});

describe("createGenerator", () => {
   test("builds CSV incrementally", () => {
      const gen = createGenerator();
      gen.addRow(["a", "b", "c"]);
      gen.addRow(["1", "2", "3"]);

      expect(gen.toString()).toBe("a,b,c\n1,2,3");
   });

   test("adds objects with headers", () => {
      const gen = createGenerator();
      const headers = ["name", "age"];
      gen.addRow(headers);
      gen.addObject({ name: "John", age: 30 }, headers);
      gen.addObject({ name: "Jane", age: 25 }, headers);

      expect(gen.toString()).toBe("name,age\nJohn,30\nJane,25");
   });

   test("creates readable stream", async () => {
      const gen = createGenerator();
      gen.addRow(["a", "b", "c"]);

      const stream = gen.toStream();
      const reader = stream.getReader();
      const { value } = await reader.read();

      expect(value).toBe("a,b,c");
   });

   test("streams rows incrementally", async () => {
      const gen = createGenerator();
      gen.addRow(["a", "b", "c"]);
      gen.addRow(["1", "2", "3"]);
      gen.addRow(["x", "y", "z"]);

      const stream = gen.toStream();
      const reader = stream.getReader();
      const chunks: string[] = [];

      let result = await reader.read();
      while (!result.done) {
         chunks.push(result.value);
         result = await reader.read();
      }

      expect(chunks).toEqual(["a,b,c\n", "1,2,3\n", "x,y,z"]);
      expect(chunks.join("")).toBe("a,b,c\n1,2,3\nx,y,z");
   });

   test("stream handles empty generator", async () => {
      const gen = createGenerator();

      const stream = gen.toStream();
      const reader = stream.getReader();
      const { done, value } = await reader.read();

      expect(done).toBe(true);
      expect(value).toBeUndefined();
   });
});
