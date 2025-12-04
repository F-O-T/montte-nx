import z from "zod";

export const createBillSchema = z.object({
   amount: z.number().positive("Valor deve ser maior que zero"),
   bankAccountId: z.string().optional(),
   categoryId: z.string().optional(),
   counterpartyId: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.date(),
   interestTemplateId: z.string().optional(),
   isRecurring: z.boolean().optional().default(false),
   issueDate: z.string().optional(),
   notes: z.string().optional(),
   recurrencePattern: z
      .enum(["monthly", "quarterly", "semiannual", "annual"])
      .optional(),
   type: z.enum(["expense", "income"], { error: "Tipo é obrigatório" }),
   installmentGroupId: z.string().optional(),
   installmentNumber: z.number().optional(),
   totalInstallments: z.number().optional(),
   installmentIntervalDays: z.number().optional(),
   originalAmount: z.number().optional(),
   autoCreateNext: z.boolean().optional().default(true),
});

export const installmentConfigSchema = z.object({
   totalInstallments: z.number().min(2).max(120),
   intervalDays: z.number().min(1).max(365),
   amounts: z.union([z.literal("equal"), z.array(z.number().positive())]),
});

export const createBillWithInstallmentsSchema = z.object({
   amount: z.number().positive("Valor deve ser maior que zero"),
   bankAccountId: z.string().optional(),
   categoryId: z.string().optional(),
   counterpartyId: z.string().optional(),
   description: z.string().optional(),
   dueDate: z.date(),
   interestTemplateId: z.string().optional(),
   issueDate: z.string().optional(),
   notes: z.string().optional(),
   type: z.enum(["expense", "income"], { error: "Tipo é obrigatório" }),
   installments: installmentConfigSchema,
});
