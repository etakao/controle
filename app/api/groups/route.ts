import { NextRequest } from "next/server";
import { defaultExpenseCategories, defaultIncomeCategories, handleError, ok, parseJson, withAuth } from "@/lib/api";
import { monthRangeUTC, todayUTC } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: auth.id
          }
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    const groupIds = groups.map((g) => g.id);
    const { from: periodStart, to: periodEnd } = monthRangeUTC(todayUTC());

    const [incomeSums, expenseSums] = await Promise.all([
      prisma.income.groupBy({
        by: ["groupId"],
        where: { groupId: { in: groupIds }, date: { gte: periodStart, lte: periodEnd } },
        _sum: { amount: true }
      }),
      prisma.expense.groupBy({
        by: ["groupId"],
        where: { groupId: { in: groupIds }, date: { gte: periodStart, lte: periodEnd } },
        _sum: { amount: true }
      })
    ]);

    const incomeByGroup = Object.fromEntries(incomeSums.map((r) => [r.groupId, Number(r._sum.amount ?? 0)]));
    const expenseByGroup = Object.fromEntries(expenseSums.map((r) => [r.groupId, Number(r._sum.amount ?? 0)]));

    return ok({
      groups: groups.map((group) => ({
        ...group,
        monthlyIncome: incomeByGroup[group.id] ?? 0,
        monthlyExpense: expenseByGroup[group.id] ?? 0
      }))
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const body = groupSchema.parse(await parseJson(request));

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name: body.name,
          description: body.description,
          createdById: auth.id,
          members: {
            create: {
              userId: auth.id,
              role: "OWNER"
            }
          }
        }
      });

      await tx.category.createMany({
        data: [...defaultIncomeCategories, ...defaultExpenseCategories].map((category) => ({
          ...category,
          groupId: created.id,
          isDefault: true
        }))
      });

      return created;
    });

    return ok({ group }, 201);
  } catch (error) {
    return handleError(error);
  }
}
