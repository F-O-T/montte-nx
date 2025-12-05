import { describe, expect, it } from "bun:test";
import { parseDateComponents, parseTimezone } from "../src/schemas";

describe("parseDateComponents", () => {
   it("parses complete date string", () => {
      const result = parseDateComponents("20231215143025");
      expect(result).toEqual({
         day: 15,
         hour: 14,
         minute: 30,
         month: 12,
         second: 25,
         year: 2023,
      });
   });

   it("parses date without time", () => {
      const result = parseDateComponents("20230601");
      expect(result).toEqual({
         day: 1,
         hour: 0,
         minute: 0,
         month: 6,
         second: 0,
         year: 2023,
      });
   });

   it("parses date with hour only", () => {
      const result = parseDateComponents("2023071512");
      expect(result).toEqual({
         day: 15,
         hour: 12,
         minute: 0,
         month: 7,
         second: 0,
         year: 2023,
      });
   });

   it("parses date with hour and minute", () => {
      const result = parseDateComponents("202308201530");
      expect(result).toEqual({
         day: 20,
         hour: 15,
         minute: 30,
         month: 8,
         second: 0,
         year: 2023,
      });
   });

   it("parses date at midnight", () => {
      const result = parseDateComponents("20230101000000");
      expect(result).toEqual({
         day: 1,
         hour: 0,
         minute: 0,
         month: 1,
         second: 0,
         year: 2023,
      });
   });

   it("parses date at end of day", () => {
      const result = parseDateComponents("20231231235959");
      expect(result).toEqual({
         day: 31,
         hour: 23,
         minute: 59,
         month: 12,
         second: 59,
         year: 2023,
      });
   });

   it("parses date with timezone suffix (ignores it)", () => {
      const result = parseDateComponents("20231215120000[-3:BRT]");
      expect(result).toEqual({
         day: 15,
         hour: 12,
         minute: 0,
         month: 12,
         second: 0,
         year: 2023,
      });
   });
});

describe("parseTimezone", () => {
   it("parses positive timezone offset", () => {
      const result = parseTimezone("20231215120000[+3:BRT]");
      expect(result).toEqual({ name: "BRT", offset: 3 });
   });

   it("parses negative timezone offset", () => {
      const result = parseTimezone("20231215120000[-5:EST]");
      expect(result).toEqual({ name: "EST", offset: -5 });
   });

   it("parses zero timezone offset", () => {
      const result = parseTimezone("20231215120000[0:GMT]");
      expect(result).toEqual({ name: "GMT", offset: 0 });
   });

   it("parses timezone with explicit positive sign", () => {
      const result = parseTimezone("20231215120000[+0:UTC]");
      expect(result).toEqual({ name: "UTC", offset: 0 });
   });

   it("returns UTC default when no timezone present", () => {
      const result = parseTimezone("20231215120000");
      expect(result).toEqual({ name: "UTC", offset: 0 });
   });

   it("parses large positive offset", () => {
      const result = parseTimezone("20231215120000[+12:NZST]");
      expect(result).toEqual({ name: "NZST", offset: 12 });
   });

   it("parses large negative offset", () => {
      const result = parseTimezone("20231215120000[-11:SST]");
      expect(result).toEqual({ name: "SST", offset: -11 });
   });

   it("handles malformed timezone gracefully", () => {
      const result = parseTimezone("20231215120000[invalid]");
      expect(result).toEqual({ name: "UTC", offset: 0 });
   });

   it("handles empty string", () => {
      const result = parseTimezone("");
      expect(result).toEqual({ name: "UTC", offset: 0 });
   });

   it("parses timezone with numeric name", () => {
      const result = parseTimezone("20231215120000[-3:BRT3]");
      expect(result).toEqual({ name: "BRT3", offset: -3 });
   });
});
