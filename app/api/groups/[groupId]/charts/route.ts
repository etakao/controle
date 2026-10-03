import { NextRequest } from "next/server";
import { handleError, ok, withGroupMember } from "@/lib/api";
import { monthRangeUTC, todayUTC } from "@/lib/dates";
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
    const today = todayUTC();
    const sixMonthsAgo = monthRangeUTC(today, -5).from;
    const historyEnd = monthRangeUTC(today).to;

    const [periodExpenses, periodIncomes, historicalIncomes, historicalExpenses] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId: params.groupId, date: { gte: range.from, lte: range.to } },
        select: { amount: true, category: { select: { id: true, name: true, color: true } } }
      }),
      prisma.income.findMany({
        where: { groupId: params.groupId, date: { gte: range.from, lte: range.to } },
        select: { amount: true }
      }),
      prisma.income.findMany({
        where: { groupId: params.groupId, date: { gte: sixMonthsAgo, lte: historyEnd } },
        select: { amount: true, date: true }
      }),
      prisma.expense.findMany({
        where: { groupId: params.groupId, date: { gte: sixMonthsAgo, lte: historyEnd } },
        select: { amount: true, date: true }
      })
    ]);

    const categoryMap = new Map<string, { name: string; value: number; color: string }>();
    for (const expense of periodExpenses) {
      const key = expense.category?.id ?? "uncategorized";
      const current = categoryMap.get(key) ?? {
        name: expense.category?.name ?? "Sem categoria",
        value: 0,
        color: expense.category?.color ?? "#FFD6C0"
      };
      current.value += Number(expense.amount);
      categoryMap.set(key, current);
    }

    const monthly = [];
    for (let index = 5; index >= 0; index -= 1) {
      const { from: monthStart, to: monthEnd } = monthRangeUTC(today, -index);
      const income = historicalIncomes
        .filter((i) => new Date(i.date) >= monthStart && new Date(i.date) <= monthEnd)
        .reduce((sum, i) => sum + Number(i.amount), 0);
      const expense = historicalExpenses
        .filter((e) => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      monthly.push({
        month: monthStart.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }),
        income,
        expense,
        balance: income - expense
      });
    }

    const totalExpense = periodExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalIncome = periodIncomes.reduce((sum, item) => sum + Number(item.amount), 0);

    return ok({
      expensesByCategory: Array.from(categoryMap.values()),
      monthly,
      balanceLine: monthly.map((item) => ({ month: item.month, balance: item.balance })),
      totals: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
      period: range
    });
  } catch (error) {
    return handleError(error);
  }
}
