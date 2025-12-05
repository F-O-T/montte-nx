import { describe, expect, it } from "bun:test";
import { normalizeTransactions, sgmlToObject } from "../src/parser";

describe("sgmlToObject", () => {
   it("parses simple tag with value", () => {
      const result = sgmlToObject("<TAG>value</TAG>");
      expect(result).toEqual({ TAG: "value" });
   });

   it("parses nested tags", () => {
      const result = sgmlToObject("<OUTER><INNER>value</INNER></OUTER>");
      expect(result).toEqual({ OUTER: { INNER: "value" } });
   });

   it("parses self-closing style tags (OFX style)", () => {
      const result = sgmlToObject("<TAG>value");
      expect(result).toEqual({ TAG: "value" });
   });

   it("parses multiple sibling tags", () => {
      const result = sgmlToObject("<A>1</A><B>2</B><C>3</C>");
      expect(result).toEqual({ A: "1", B: "2", C: "3" });
   });

   it("parses deeply nested structure", () => {
      const result = sgmlToObject("<L1><L2><L3><L4>deep</L4></L3></L2></L1>");
      expect(result).toEqual({ L1: { L2: { L3: { L4: "deep" } } } });
   });

   it("handles duplicate tags by creating array", () => {
      const result = sgmlToObject("<ITEM>a</ITEM><ITEM>b</ITEM>");
      expect(result).toEqual({ ITEM: ["a", "b"] });
   });

   it("removes XML declaration", () => {
      const result = sgmlToObject('<?xml version="1.0"?><TAG>value</TAG>');
      expect(result).toEqual({ TAG: "value" });
   });

   it("removes HTML comments", () => {
      const result = sgmlToObject("<!-- comment --><TAG>value</TAG>");
      expect(result).toEqual({ TAG: "value" });
   });

   it("handles empty content", () => {
      const result = sgmlToObject("");
      expect(result).toEqual({});
   });

   it("handles whitespace-only content", () => {
      const result = sgmlToObject("   \n\t   ");
      expect(result).toEqual({});
   });

   it("parses typical OFX structure", () => {
      const ofx = `<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
</SONRS>
</SIGNONMSGSRSV1>
</OFX>`;
      const result = sgmlToObject(ofx);
      expect(result.OFX).toBeDefined();
      expect(
         (result.OFX as Record<string, unknown>).SIGNONMSGSRSV1,
      ).toBeDefined();
   });

   it("handles tags with dots in name", () => {
      const result = sgmlToObject("<TAG.NAME>value</TAG.NAME>");
      expect(result).toEqual({ "TAG.NAME": "value" });
   });

   it("trims text content", () => {
      const result = sgmlToObject("<TAG>  value  </TAG>");
      expect(result).toEqual({ TAG: "value" });
   });

   it("handles multiple levels of nesting with values", () => {
      const sgml = "<A><B>1</B><C><D>2</D></C></A>";
      const result = sgmlToObject(sgml);
      expect(result).toEqual({
         A: { B: "1", C: { D: "2" } },
      });
   });

   it("handles multiline content", () => {
      const result = sgmlToObject(`<TAG>
value
</TAG>`);
      expect(result).toEqual({ TAG: "value" });
   });

   it("parses three duplicate tags into array", () => {
      const result = sgmlToObject("<X>1</X><X>2</X><X>3</X>");
      expect(result).toEqual({ X: ["1", "2", "3"] });
   });

   it("handles mixed content and nested tags", () => {
      const sgml =
         "<PARENT><CHILD1>a</CHILD1><CHILD2><GRANDCHILD>b</GRANDCHILD></CHILD2></PARENT>";
      const result = sgmlToObject(sgml);
      expect(result).toEqual({
         PARENT: {
            CHILD1: "a",
            CHILD2: { GRANDCHILD: "b" },
         },
      });
   });
});

describe("normalizeTransactions", () => {
   it("converts single STMTTRN to array in bank statement", () => {
      const data = {
         OFX: {
            BANKMSGSRSV1: {
               STMTTRNRS: {
                  STMTRS: {
                     BANKTRANLIST: {
                        STMTTRN: { FITID: "123", TRNAMT: "100" },
                     },
                  },
               },
            },
         },
      };
      const result = normalizeTransactions(data);
      const tranlist = (
         (
            (result.OFX as Record<string, unknown>).BANKMSGSRSV1 as Record<
               string,
               unknown
            >
         ).STMTTRNRS as Record<string, unknown>
      ).STMTRS as Record<string, unknown>;
      expect(
         (tranlist.BANKTRANLIST as Record<string, unknown>).STMTTRN,
      ).toEqual([{ FITID: "123", TRNAMT: "100" }]);
   });

   it("preserves STMTTRN array unchanged in bank statement", () => {
      const data = {
         OFX: {
            BANKMSGSRSV1: {
               STMTTRNRS: {
                  STMTRS: {
                     BANKTRANLIST: {
                        STMTTRN: [
                           { FITID: "1", TRNAMT: "10" },
                           { FITID: "2", TRNAMT: "20" },
                        ],
                     },
                  },
               },
            },
         },
      };
      const result = normalizeTransactions(data);
      const tranlist = (
         (
            (result.OFX as Record<string, unknown>).BANKMSGSRSV1 as Record<
               string,
               unknown
            >
         ).STMTTRNRS as Record<string, unknown>
      ).STMTRS as Record<string, unknown>;
      expect(
         (tranlist.BANKTRANLIST as Record<string, unknown>).STMTTRN,
      ).toEqual([
         { FITID: "1", TRNAMT: "10" },
         { FITID: "2", TRNAMT: "20" },
      ]);
   });

   it("handles deeply nested structure", () => {
      const data = {
         OFX: {
            BANKMSGSRSV1: {
               STMTTRNRS: {
                  STMTRS: {
                     BANKTRANLIST: {
                        STMTTRN: { FITID: "123" },
                     },
                  },
               },
            },
         },
      };
      const result = normalizeTransactions(data);
      const tranlist = (
         (
            (result.OFX as Record<string, unknown>).BANKMSGSRSV1 as Record<
               string,
               unknown
            >
         ).STMTTRNRS as Record<string, unknown>
      ).STMTRS as Record<string, unknown>;
      expect(
         (tranlist.BANKTRANLIST as Record<string, unknown>).STMTTRN,
      ).toEqual([{ FITID: "123" }]);
   });

   it("handles empty object", () => {
      const result = normalizeTransactions({});
      expect(result).toEqual({});
   });

   it("handles object without STMTTRN", () => {
      const data = { OTHER: { KEY: "value" } };
      const result = normalizeTransactions(data);
      expect(result).toEqual({ OTHER: { KEY: "value" } });
   });

   it("normalizes nested objects within STMTTRN array in credit card statement", () => {
      const data = {
         OFX: {
            CREDITCARDMSGSRSV1: {
               CCSTMTTRNRS: {
                  CCSTMTRS: {
                     BANKTRANLIST: {
                        STMTTRN: [{ FITID: "1", NESTED: { DEEP: "value" } }],
                     },
                  },
               },
            },
         },
      };
      const result = normalizeTransactions(data);
      const tranlist = (
         (
            (result.OFX as Record<string, unknown>)
               .CREDITCARDMSGSRSV1 as Record<string, unknown>
         ).CCSTMTTRNRS as Record<string, unknown>
      ).CCSTMTRS as Record<string, unknown>;
      expect(
         (tranlist.BANKTRANLIST as Record<string, unknown>).STMTTRN,
      ).toEqual([{ FITID: "1", NESTED: { DEEP: "value" } }]);
   });
});
