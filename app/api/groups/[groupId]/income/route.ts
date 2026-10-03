import { type Income } from "@prisma/client";
import { addMonthsUTC } from "@/lib/dates";
import { NextRequest } from "next/server";
import { assertGroupMember, fail, handleError, ok, parseJson, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPeriodRange } from "@/lib/utils";
import { incomeSchema } from "@/lib/validations/finance";

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
    const incomes = await prisma.income.findMany({
      where: {
        groupId: params.groupId,
        date: {
          gte: range.from,
          lte: range.to
        }
      },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        category: true
      },
      orderBy: { date: "desc" }
    });

    return ok({
      incomes,
      total: incomes.reduce((sum, item) => sum + Number(item.amount), 0),
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

    const body = incomeSchema.parse(await parseJson(request));
    const responsibleIsMember = await assertGroupMember(body.responsibleId, params.groupId);
    if (!responsibleIsMember) {
      return fail("Responsável não pertence ao grupo", 422);
    }

    if (!body.isRecurring || !body.recurringFrequency || !body.recurringTotal) {
      const income = await prisma.income.create({
        data: {
          ...body,
          groupId: params.groupId,
          categoryId: body.categoryId || null,
          isRecurring: false,
          recurringFrequency: undefined,
          recurringInterval: undefined,
          recurringTotal: undefined
        }
      });
      return ok({ income }, 201);
    }

    const total = body.recurringTotal;
    const incomes = await prisma.$transaction(async (tx) => {
      const created = [];
      let ref: string | null = null;
      let currentDate = body.date;

      for (let i = 0; i < total; i++) {
        const income: Income = await tx.income.create({
          data: {
            groupId: params.groupId,
            responsibleId: body.responsibleId,
            categoryId: body.categoryId || null,
            amount: body.amount,
            date: currentDate,
            description: body.description,
            isRecurring: true,
            recurringFrequency: body.recurringFrequency,
            recurringInterval: body.recurringInterval,
            recurringRef: ref,
            recurringNum: i + 1,
            recurringTotal: total
          }
        });

        if (!ref) {
          ref = income.id;
          await tx.income.update({ where: { id: income.id }, data: { recurringRef: income.id } });
        }

        created.push(income);
        currentDate = getNextDate(currentDate, body.recurringFrequency!, body.recurringInterval);
      }

      return created;
    });

    return ok({ incomes }, 201);
  } catch (error) {
    return handleError(error);
  }
}
