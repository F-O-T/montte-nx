import z from "zod";

export const createBillSchema = z.object({
   amount: z.number().positive("Valor deve ser maior que zero"),
   autoCreateNext: z.boolean().optional().default(true),
   bankAccountId: z.string().optional(),
   categoryId: z.string().optional(),
   counterpartyId: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.date(),
   installmentGroupId: z.string().optional(),
   installmentIntervalDays: z.number().optional(),
   installmentNumber: z.number().optional(),
   interestTemplateId: z.string().optional(),
   isRecurring: z.boolean().optional().default(false),
   issueDate: z.date().optional(),
   notes: z.string().optional(),
   originalAmount: z.number().optional(),
   recurrencePattern: z
      .enum(["monthly", "quarterly", "semiannual", "annual"])
      .optional(),
   totalInstallments: z.number().optional(),
   type: z.enum(["expense", "income"], { error: "Tipo é obrigatório" }),
});

export const installmentConfigSchema = z.object({
   amounts: z.union([z.literal("equal"), z.array(z.number().positive())]),
   intervalDays: z.number().min(1).max(365),
   totalInstallments: z.number().min(2).max(120),
});

export const createBillWithInstallmentsSchema = z.object({
   amount: z.number().positive("Valor deve ser maior que zero"),
   bankAccountId: z.string().optional(),
   categoryId: z.string().optional(),
   counterpartyId: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.date(),
   installments: installmentConfigSchema,
   interestTemplateId: z.string().optional(),
   issueDate: z.string().optional(),
   notes: z.string().optional(),
   type: z.enum(["expense", "income"], { error: "Tipo é obrigatório" }),
});
