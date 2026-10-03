import { CategoryType, PaymentMethod, RecurringFrequency, SplitStatus } from "@prisma/client";
import { z } from "zod";

const id = z.string().min(1);
const money = z.coerce.number().positive();

export const groupSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().nullable()
});

export const categorySchema = z.object({
  name: z.string().min(2).max(60),
  type: z.nativeEnum(CategoryType),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(24).optional()
});

export const categoryUpdateSchema = categorySchema.partial().extend({
  id
});

export const recurringSchema = z.object({
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.nativeEnum(RecurringFrequency).optional().nullable(),
  recurringInterval: z.coerce.number().int().min(1).max(24).optional().nullable(),
  recurringTotal: z.coerce.number().int().min(2).max(120).optional().nullable()
});

export const incomeSchema = z.object({
  responsibleId: id,
  categoryId: z.string().optional().nullable(),
  amount: money,
  date: z.coerce.date(),
  description: z.string().max(240).optional().nullable()
}).merge(recurringSchema);

export const incomeUpdateSchema = incomeSchema.partial();

export const expenseSplitInputSchema = z.object({
  userId: id,
  amount: money.optional()
});

export const expenseSchema = z.object({
  responsibleId: id,
  categoryId: z.string().optional().nullable(),
  amount: money,
  date: z.coerce.date(),
  description: z.string().max(240).optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  installments: z.coerce.number().int().min(1).max(48).default(1),
  splits: z.array(expenseSplitInputSchema).default([])
}).merge(recurringSchema);

export const expenseUpdateSchema = expenseSchema.partial();

export const splitUpdateSchema = z.object({
  status: z.nativeEnum(SplitStatus)
});

export const inviteAcceptSchema = z.object({
  token: id
});
