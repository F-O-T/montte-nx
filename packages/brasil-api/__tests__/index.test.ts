import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { getAllBrazilianBanks } from "../src/index";

const mockBanks = [
   {
      code: "001",
      fullName: "Banco do Brasil S.A.",
      ispb: "00000000",
      name: "BCO DO BRASIL S.A.",
   },
   {
      code: "237",
      fullName: "Banco Bradesco S.A.",
      ispb: "60746948",
      name: "BCO BRADESCO S.A.",
   },
   {
      code: "341",
      fullName: "Itaú Unibanco S.A.",
      ispb: "60701190",
      name: "ITAÚ UNIBANCO S.A.",
   },
   {
      code: "104",
      fullName: "Caixa Econômica Federal",
      ispb: "00360305",
      name: "CAIXA ECONOMICA FEDERAL",
   },
   {
      code: "033",
      fullName: "Banco Santander (Brasil) S.A.",
      ispb: "90400888",
      name: "BCO SANTANDER (BRASIL) S.A.",
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
      fetchSpy = spyOn(globalThis, "fetch").mockImplementation((() =>
         createMockResponse(mockBanks)) as unknown as typeof fetch);
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
               code: null,
               fullName: "Sistema de Pagamentos Instantâneos",
               ispb: "00000000",
               name: "PIX",
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
            code: String(i).padStart(3, "0"),
            fullName: `Full Name Bank ${i}`,
            ispb: String(i).padStart(8, "0"),
            name: `Bank ${i}`,
         }));
         fetchSpy.mockImplementation(() => createMockResponse(manyBanks));

         const result = await getAllBrazilianBanks();

         expect(result).toHaveLength(250);
      });
   });
});
