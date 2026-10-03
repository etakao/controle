import { NextRequest } from "next/server";
import { handleError, ok, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPeriodRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const range = getPeriodRange(request.nextUrl.searchParams);
    const [incomes, expenses, pendingSplits] = await Promise.all([
      prisma.income.findMany({
        where: { groupId: params.groupId, date: { gte: range.from, lte: range.to } },
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          isRecurring: true,
          recurringRef: true,
          categoryId: true,
          responsibleId: true,
          category: { select: { id: true, name: true, color: true, type: true } },
          responsible: { select: { id: true, name: true } }
        }
      }),
      prisma.expense.findMany({
        where: { groupId: params.groupId, date: { gte: range.from, lte: range.to } },
        select: {
          id: true,
          amount: true,
          date: true,
          description: true,
          paymentMethod: true,
          installments: true,
          installmentNum: true,
          isRecurring: true,
          recurringRef: true,
          categoryId: true,
          responsibleId: true,
          category: { select: { id: true, name: true, color: true, type: true } },
          responsible: { select: { id: true, name: true } }
        }
      }),
      prisma.expenseSplit.findMany({
        where: {
          status: "PENDING",
          expense: { groupId: params.groupId, date: { gte: range.from, lte: range.to } }
        },
        select: { amount: true }
      })
    ]);

    const timeline = [
      ...incomes.map((item) => ({ ...item, kind: "income" as const })),
      ...expenses.map((item) => ({ ...item, kind: "expense" as const }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const incomeTotal = incomes.reduce((sum, item) => sum + Number(item.amount), 0);
    const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const pendingSplitTotal = pendingSplits.reduce((sum, item) => sum + Number(item.amount), 0);

    return ok({
      timeline,
      summary: {
        incomeTotal,
        expenseTotal,
        balance: incomeTotal - expenseTotal,
        pendingSplitTotal
      },
      period: range
    });
  } catch (error) {
    return handleError(error);
  }
}
