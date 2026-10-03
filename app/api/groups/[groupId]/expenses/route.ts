import { PaymentMethod, type Expense } from "@prisma/client";
import { addMonthsUTC } from "@/lib/dates";
import { NextRequest } from "next/server";
import { assertGroupMember, fail, handleError, ok, parseJson, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { buildSplitRows } from "@/lib/splits";
import { getPeriodRange } from "@/lib/utils";
import { expenseSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

function getNextDate(date: Date, frequency: string, customInterval?: number | null): Date {
  switch (frequency) {
    case "MONTHLY": return addMonthsUTC(date, 1);
    case "ANNUAL": return addMonthsUTC(date, 12);
    case "CUSTOM": return addMonthsUTC(date, customInterval ?? 1);
    default: return addMonthsUTC(date, 1);
  }
}

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const range = getPeriodRange(request.nextUrl.searchParams);
    const expenses = await prisma.expense.findMany({
      where: {
        groupId: params.groupId,
        date: {
          gte: range.from,
          lte: range.to
        }
      },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        category: true,
        splits: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { date: "desc" }
    });

    return ok({
      expenses,
      total: expenses.reduce((sum, item) => sum + Number(item.amount), 0),
      period: range
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const body = expenseSchema.parse(await parseJson(request));
    const responsibleIsMember = await assertGroupMember(body.responsibleId, params.groupId);
    if (!responsibleIsMember) {
      return fail("Responsável não pertence ao grupo", 422);
    }

    for (const split of body.splits) {
      const splitUserIsMember = await assertGroupMember(split.userId, params.groupId);
      if (!splitUserIsMember) {
        return fail("Um dos participantes da divisão não pertence ao grupo", 422);
      }
    }

    const installments = body.paymentMethod === PaymentMethod.CREDIT_CARD ? body.installments : 1;
    const installmentAmount = Number((body.amount / installments).toFixed(2));

    if (body.isRecurring && body.recurringFrequency && body.recurringTotal) {
      const total = body.recurringTotal;
      const expenses = await prisma.$transaction(async (tx) => {
        const created = [];
        let recurRef: string | null = null;
        let currentDate = body.date;

        for (let i = 0; i < total; i++) {
          const expense: Expense = await tx.expense.create({
            data: {
              groupId: params.groupId,
              responsibleId: body.responsibleId,
              categoryId: body.categoryId || null,
              amount: body.amount,
              date: currentDate,
              description: body.description,
              paymentMethod: body.paymentMethod,
              installments: 1,
              isRecurring: true,
              recurringFrequency: body.recurringFrequency,
              recurringInterval: body.recurringInterval,
              recurringRef: recurRef,
              recurringNum: i + 1,
              recurringTotal: total
            }
          });

          if (!recurRef) {
            recurRef = expense.id;
            await tx.expense.update({ where: { id: expense.id }, data: { recurringRef: expense.id } });
          }

          if (body.splits.length > 0) {
            await tx.expenseSplit.createMany({
              data: buildSplitRows(expense.id, body.responsibleId, body.amount, body.splits)
            });
          }

          created.push(expense);
          currentDate = getNextDate(currentDate, body.recurringFrequency!, body.recurringInterval);
        }

        return created;
      });

      return ok({ expenses }, 201);
    }

    const createdExpenses = await prisma.$transaction(async (tx) => {
      const expenses = [];
      let firstExpenseId: string | null = null;

      for (let index = 0; index < installments; index += 1) {
        const expense: Expense = await tx.expense.create({
          data: {
            groupId: params.groupId,
            responsibleId: body.responsibleId,
            categoryId: body.categoryId || null,
            amount: installmentAmount,
            date: addMonthsUTC(body.date, index),
            description: body.description,
            paymentMethod: body.paymentMethod,
            installments,
            installmentRef: firstExpenseId,
            installmentNum: index + 1
          }
        });

        if (!firstExpenseId) {
          firstExpenseId = expense.id;
          await tx.expense.update({
            where: { id: expense.id },
            data: { installmentRef: expense.id }
          });
        }

        if (body.splits.length > 0) {
          await tx.expenseSplit.createMany({
            data: buildSplitRows(expense.id, body.responsibleId, installmentAmount, body.splits)
          });
        }

        expenses.push(expense);
      }

      return expenses;
    });

    return ok({ expenses: createdExpenses }, 201);
  } catch (error) {
    return handleError(error);
  }
}
