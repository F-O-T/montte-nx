import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { getAllBrazilianBanks } from "../src/index";

const mockBanks = [
   {
      name: "BCO DO BRASIL S.A.",
      code: "001",
      ispb: "00000000",
      fullName: "Banco do Brasil S.A.",
   },
   {
      name: "BCO BRADESCO S.A.",
      code: "237",
      ispb: "60746948",
      fullName: "Banco Bradesco S.A.",
   },
   {
      name: "ITAÚ UNIBANCO S.A.",
      code: "341",
      ispb: "60701190",
      fullName: "Itaú Unibanco S.A.",
   },
   {
      name: "CAIXA ECONOMICA FEDERAL",
      code: "104",
      ispb: "00360305",
      fullName: "Caixa Econômica Federal",
   },
   {
      name: "BCO SANTANDER (BRASIL) S.A.",
      code: "033",
      ispb: "90400888",
      fullName: "Banco Santander (Brasil) S.A.",
   },
];

const createMockResponse = (data: unknown) =>
   Promise.resolve({
      json: () => Promise.resolve(data),
      ok: true,
      status: 200,
   } as Response);

describe("brasil-api", () => {
   let fetchSpy: ReturnType<typeof spyOn>;

   beforeEach(() => {
      fetchSpy = spyOn(globalThis, "fetch").mockImplementation(() =>
         createMockResponse(mockBanks),
      );
   });

   afterEach(() => {
      fetchSpy.mockRestore();
   });

   describe("getAllBrazilianBanks", () => {
      it("should fetch all Brazilian banks from the API", async () => {
         const result = await getAllBrazilianBanks();

         expect(result).toEqual(mockBanks);
         expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      it("should call the correct API endpoint", async () => {
         await getAllBrazilianBanks();

         expect(fetchSpy).toHaveBeenCalledWith(
            "https://brasilapi.com.br/api/banks/v1",
         );
      });

      it("should return an array of banks", async () => {
         const result = await getAllBrazilianBanks();

         expect(Array.isArray(result)).toBe(true);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should return banks with required properties", async () => {
         const result = await getAllBrazilianBanks();

         for (const bank of result) {
            expect(bank).toHaveProperty("name");
            expect(bank).toHaveProperty("code");
            expect(bank).toHaveProperty("ispb");
            expect(bank).toHaveProperty("fullName");
         }
      });

      it("should return banks with correct data types", async () => {
         const result = await getAllBrazilianBanks();

         for (const bank of result) {
            expect(typeof bank.name).toBe("string");
            expect(typeof bank.code).toBe("string");
            expect(typeof bank.ispb).toBe("string");
            expect(typeof bank.fullName).toBe("string");
         }
      });

      it("should return Banco do Brasil with code 001", async () => {
         const result = await getAllBrazilianBanks();

         const bancoDoBrasil = result.find((bank) => bank.code === "001");
         expect(bancoDoBrasil).toBeDefined();
         expect(bancoDoBrasil?.name).toContain("BRASIL");
      });

      it("should handle empty response", async () => {
         fetchSpy.mockImplementation(() => createMockResponse([]));

         const result = await getAllBrazilianBanks();

         expect(result).toEqual([]);
         expect(result).toHaveLength(0);
      });

      it("should handle single bank response", async () => {
         const singleBank = [mockBanks[0]];
         fetchSpy.mockImplementation(() => createMockResponse(singleBank));

         const result = await getAllBrazilianBanks();

         expect(result).toHaveLength(1);
         expect(result[0]?.code).toBe("001");
      });

      it("should propagate fetch errors", async () => {
         fetchSpy.mockImplementation(() =>
            Promise.reject(new Error("Network error")),
         );

         expect(getAllBrazilianBanks()).rejects.toThrow("Network error");
      });

      it("should handle banks with null code", async () => {
         const banksWithNullCode = [
            {
               name: "PIX",
               code: null,
               ispb: "00000000",
               fullName: "Sistema de Pagamentos Instantâneos",
            },
         ];
         fetchSpy.mockImplementation(() =>
            createMockResponse(banksWithNullCode),
         );

         const result = await getAllBrazilianBanks();

         expect(result).toHaveLength(1);
         expect(result[0]?.code).toBeNull();
      });

      it("should handle large number of banks", async () => {
         const manyBanks = Array.from({ length: 250 }, (_, i) => ({
            name: `Bank ${i}`,
            code: String(i).padStart(3, "0"),
            ispb: String(i).padStart(8, "0"),
            fullName: `Full Name Bank ${i}`,
         }));
         fetchSpy.mockImplementation(() => createMockResponse(manyBanks));

         const result = await getAllBrazilianBanks();

         expect(result).toHaveLength(250);
      });
   });
});
