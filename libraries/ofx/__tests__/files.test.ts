import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseBuffer } from "../src/parser";

const filesDir = join(import.meta.dirname, "../files");

describe("files integration tests", () => {
   const files = readdirSync(filesDir).filter((f) => f.endsWith(".ofx"));

   it("has OFX files to test", () => {
      expect(files.length).toBeGreaterThan(0);
   });

   for (const file of files) {
      describe(file, () => {
         it("parses successfully", () => {
            const buffer = readFileSync(join(filesDir, file));
            const result = parseBuffer(new Uint8Array(buffer));
            expect(result.success).toBe(true);
         });

         it("has valid structure", () => {
            const buffer = readFileSync(join(filesDir, file));
            const result = parseBuffer(new Uint8Array(buffer));
            if (result.success) {
               expect(result.data.header).toBeDefined();
               expect(result.data.OFX).toBeDefined();
               expect(result.data.OFX.SIGNONMSGSRSV1).toBeDefined();
            }
         });
      });
   }
});

describe("Portuguese character preservation", () => {
   it("ExtratoOFX.ofx preserves accented characters", () => {
      const buffer = readFileSync(join(filesDir, "ExtratoOFX.ofx"));
      const result = parseBuffer(new Uint8Array(buffer));

      expect(result.success).toBe(true);
      if (result.success) {
         const ccMsgs = result.data.OFX.CREDITCARDMSGSRSV1;
         if (ccMsgs) {
            const responses = Array.isArray(ccMsgs.CCSTMTTRNRS)
               ? ccMsgs.CCSTMTTRNRS
               : [ccMsgs.CCSTMTTRNRS];
            for (const rs of responses) {
               const txns = rs?.CCSTMTRS?.BANKTRANLIST?.STMTTRN ?? [];
               const names = txns.map((t) => t.NAME).filter(Boolean);
               const hasPortuguese = names.some((name) =>
                  /[ãõáéíóúâêôçÃÕÁÉÍÓÚÂÊÔÇ]/.test(name ?? ""),
               );
               if (names.length > 0) {
                  expect(hasPortuguese).toBe(true);
               }
            }
         }
      }
   });

   it("Exemplo.ofx preserves UTF-8 characters", () => {
      const buffer = readFileSync(join(filesDir, "Exemplo.ofx"));
      const result = parseBuffer(new Uint8Array(buffer));

      expect(result.success).toBe(true);
      if (result.success) {
         const bankMsgs = result.data.OFX.BANKMSGSRSV1;
         if (bankMsgs) {
            const responses = Array.isArray(bankMsgs.STMTTRNRS)
               ? bankMsgs.STMTTRNRS
               : [bankMsgs.STMTTRNRS];
            for (const rs of responses) {
               const txns = rs?.STMTRS?.BANKTRANLIST?.STMTTRN ?? [];
               const transacao = txns.find((t) =>
                  t.NAME?.includes("Transação"),
               );
               expect(transacao).toBeDefined();
               expect(transacao?.NAME).toContain("ã");
            }
         }
      }
   });
});
