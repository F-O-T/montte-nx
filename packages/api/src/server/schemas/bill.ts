import z from "zod";

export const createBillSchema = z.object({
   amount: z.number().positive("Valor deve ser maior que zero"),
   bankAccountId: z.string().optional(),
   categoryId: z.string().optional(),
   counterparty: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.date(),
   isRecurring: z.boolean().optional().default(false),
   issueDate: z.string().optional(),
   notes: z.string().optional(),
   recurrencePattern: z
      .enum(["monthly", "quarterly", "semiannual", "annual"])
      .optional(),
   type: z.enum(["expense", "income"], { error: "Tipo é obrigatório" }),
});
