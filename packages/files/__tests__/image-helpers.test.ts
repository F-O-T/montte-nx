import { describe, expect, it } from "bun:test";
import { compressImage } from "../src/image-helpers";

const createValidPngBuffer = async (): Promise<Buffer> => {
   const sharp = (await import("sharp")).default;
   return sharp({
      create: {
         background: { b: 0, g: 0, r: 255 },
         channels: 3,
         height: 100,
         width: 100,
      },
   })
      .png()
      .toBuffer();
};

describe("image helpers", () => {
   describe("compressImage", () => {
      it("should compress image to jpeg format by default", async () => {
         const inputBuffer = await createValidPngBuffer();
         const result = await compressImage(inputBuffer);

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should compress image to jpeg format explicitly", async () => {
         const inputBuffer = await createValidPngBuffer();
         const result = await compressImage(inputBuffer, { format: "jpeg" });

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should compress image to png format", async () => {
         const inputBuffer = await createValidPngBuffer();
         const result = await compressImage(inputBuffer, { format: "png" });

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should compress image to webp format", async () => {
         const inputBuffer = await createValidPngBuffer();
         const result = await compressImage(inputBuffer, { format: "webp" });

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should compress image to avif format", async () => {
         const inputBuffer = await createValidPngBuffer();
         const result = await compressImage(inputBuffer, { format: "avif" });

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should use default quality of 80", async () => {
         const inputBuffer = await createValidPngBuffer();
         const resultDefault = await compressImage(inputBuffer, {
            format: "jpeg",
         });
         const resultExplicit = await compressImage(inputBuffer, {
            format: "jpeg",
            quality: 80,
         });

         expect(resultDefault.length).toBe(resultExplicit.length);
      });

      it("should respect custom quality setting", async () => {
         const inputBuffer = await createValidPngBuffer();
         const lowQuality = await compressImage(inputBuffer, {
            format: "jpeg",
            quality: 10,
         });
         const highQuality = await compressImage(inputBuffer, {
            format: "jpeg",
            quality: 100,
         });

         expect(lowQuality.length).toBeLessThan(highQuality.length);
      });

      it("should handle empty options object", async () => {
         const inputBuffer = await createValidPngBuffer();
         const result = await compressImage(inputBuffer, {});

         expect(result).toBeInstanceOf(Buffer);
         expect(result.length).toBeGreaterThan(0);
      });

      it("should throw error for invalid input buffer", () => {
         const invalidBuffer = Buffer.from("not an image");

         expect(() => compressImage(invalidBuffer)).toThrow();
      });

      it("should throw error for empty buffer", () => {
         const emptyBuffer = Buffer.alloc(0);

         expect(() => compressImage(emptyBuffer)).toThrow();
      });
   });
});
