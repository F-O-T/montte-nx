import type { DRESnapshotData } from "@packages/database/schemas/custom-reports";
import { renderToBuffer } from "@react-pdf/renderer";
import { DREFiscalTemplate } from "./templates/dre-fiscal";
import { DREGerencialTemplate } from "./templates/dre-gerencial";

export type RenderDREReportOptions = {
   name: string;
   type: "dre_gerencial" | "dre_fiscal";
   startDate: string;
   endDate: string;
   snapshotData: DRESnapshotData;
};

export async function renderDREReport(
   options: RenderDREReportOptions,
): Promise<Buffer> {
   const { type, ...props } = options;

   const document =
      type === "dre_gerencial"
         ? DREGerencialTemplate(props)
         : DREFiscalTemplate(props);

   const buffer = await renderToBuffer(document);
   return Buffer.from(buffer);
}

export { DREFiscalTemplate } from "./templates/dre-fiscal";
export { DREGerencialTemplate } from "./templates/dre-gerencial";
