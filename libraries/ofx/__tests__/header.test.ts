import { describe, expect, it } from "bun:test";
import { parseHeader } from "../src/parser";

describe("parseHeader", () => {
   it("parses standard OFX header", () => {
      const content = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>content</OFX>`;
      const result = parseHeader(content);
      expect(result.header).toEqual({
         CHARSET: "1252",
         COMPRESSION: "NONE",
         DATA: "OFXSGML",
         ENCODING: "USASCII",
         NEWFILEUID: "NONE",
         OFXHEADER: "100",
         OLDFILEUID: "NONE",
         SECURITY: "NONE",
         VERSION: "102",
      });
      expect(result.body).toContain("<OFX>");
   });

   it("parses header with Windows line endings", () => {
      const content =
         "OFXHEADER:100\r\nDATA:OFXSGML\r\nVERSION:100\r\n\r\n<OFX></OFX>";
      const result = parseHeader(content);
      expect(result.header.OFXHEADER).toBe("100");
      expect(result.header.VERSION).toBe("100");
   });

   it("handles XML declaration in body", () => {
      const content = `<?xml version="1.0"?>
<OFX>body</OFX>`;
      const result = parseHeader(content);
      expect(result.header).toEqual({});
      expect(result.body).toContain("<OFX>");
   });

   it("handles OFX tag without header", () => {
      const content = "<OFX>content</OFX>";
      const result = parseHeader(content);
      expect(result.header).toEqual({});
      expect(result.body).toBe("<OFX>content</OFX>");
   });

   it("extracts body after empty line", () => {
      const content = `OFXHEADER:100

<OFX>body here</OFX>`;
      const result = parseHeader(content);
      expect(result.body.trim()).toBe("<OFX>body here</OFX>");
   });

   it("parses partial header", () => {
      const content = `OFXHEADER:100
VERSION:220

<OFX></OFX>`;
      const result = parseHeader(content);
      expect(result.header.OFXHEADER).toBe("100");
      expect(result.header.VERSION).toBe("220");
      expect(result.header.DATA).toBeUndefined();
   });

   it("handles empty content", () => {
      const result = parseHeader("");
      expect(result.header).toEqual({});
      expect(result.body).toBe("");
   });

   it("handles whitespace-only lines in header", () => {
      const content = `OFXHEADER:100
   
VERSION:102

<OFX></OFX>`;
      const result = parseHeader(content);
      expect(result.header.OFXHEADER).toBe("100");
   });

   it("handles header with empty value", () => {
      const content = `OFXHEADER:100
DATA:
VERSION:102

<OFX></OFX>`;
      const result = parseHeader(content);
      expect(result.header.DATA).toBe("");
   });

   it("preserves body content exactly", () => {
      const bodyContent = "<OFX>\n<SIGNONMSGSRSV1>\n</SIGNONMSGSRSV1>\n</OFX>";
      const content = `OFXHEADER:100

${bodyContent}`;
      const result = parseHeader(content);
      expect(result.body.trim()).toBe(bodyContent);
   });

   it("handles multiple colons in value", () => {
      const content = `OFXHEADER:100
DATA:OFXSGML:v1

<OFX></OFX>`;
      const result = parseHeader(content);
      expect(result.header.DATA).toBe("OFXSGML:v1");
   });

   it("ignores non-header lines before body", () => {
      const content = `OFXHEADER:100
this is not a header line
VERSION:102

<OFX></OFX>`;
      const result = parseHeader(content);
      expect(result.header.OFXHEADER).toBe("100");
      expect(result.header.VERSION).toBe("102");
   });

   it("handles Unix line endings", () => {
      const content = "OFXHEADER:100\nVERSION:200\n\n<OFX></OFX>";
      const result = parseHeader(content);
      expect(result.header.VERSION).toBe("200");
   });

   it("handles mixed line endings", () => {
      const content = "OFXHEADER:100\r\nVERSION:200\n\n<OFX></OFX>";
      const result = parseHeader(content);
      expect(result.header.OFXHEADER).toBe("100");
      expect(result.header.VERSION).toBe("200");
   });

   it("handles content starting with xml tag", () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200"?>
<OFX>body</OFX>`;
      const result = parseHeader(content);
      expect(result.body).toContain("<?xml");
   });
});
