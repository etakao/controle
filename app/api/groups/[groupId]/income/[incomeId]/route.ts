import { NextRequest } from "next/server";
import { assertGroupMember, fail, handleError, ok, parseJson, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { incomeUpdateSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

const incomeSelect = {
  id: true,
  groupId: true,
  responsibleId: true,
  categoryId: true,
  amount: true,
  date: true,
  description: true,
  isRecurring: true,
  recurringFrequency: true,
  recurringInterval: true,
  recurringRef: true,
  recurringNum: true,
  recurringTotal: true
} as const;

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string; incomeId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const body = incomeUpdateSchema.parse(await parseJson(request));
    if (body.responsibleId) {
      const responsibleIsMember = await assertGroupMember(body.responsibleId, params.groupId);
      if (!responsibleIsMember) {
        return fail("Responsável não pertence ao grupo", 422);
      }
    }

    const current = await prisma.income.findFirst({
      where: { id: params.incomeId, groupId: params.groupId }
    });

    if (!current) {
      return fail("Receita não encontrada", 404);
    }

    const mode = request.nextUrl.searchParams.get("mode") ?? "single";

    if (mode === "all" && current.recurringRef) {
      await prisma.income.updateMany({
        where: { recurringRef: current.recurringRef },
        data: {
          responsibleId: body.responsibleId ?? undefined,
          categoryId: body.categoryId === null ? null : (body.categoryId || undefined),
          amount: body.amount ?? undefined,
          description: body.description === null ? null : (body.description || undefined)
        }
      });
      const updated = await prisma.income.findFirst({ where: { id: params.incomeId }, select: incomeSelect });
      return ok({ income: updated });
    }

    if (mode === "from_now" && current.recurringRef) {
      await prisma.income.updateMany({
        where: {
          recurringRef: current.recurringRef,
          date: { gte: current.date }
        },
        data: {
          responsibleId: body.responsibleId ?? undefined,
          categoryId: body.categoryId === null ? null : (body.categoryId || undefined),
          amount: body.amount ?? undefined,
          description: body.description === null ? null : (body.description || undefined)
        }
      });
      const updated = await prisma.income.findFirst({ where: { id: params.incomeId }, select: incomeSelect });
      return ok({ income: updated });
    }

    const income = await prisma.income.update({
      where: { id: params.incomeId },
      data: {
        responsibleId: body.responsibleId ?? undefined,
        categoryId: body.categoryId === null ? null : (body.categoryId || undefined),
        amount: body.amount ?? undefined,
        date: body.date ?? undefined,
        description: body.description === null ? null : (body.description || undefined)
      },
      select: incomeSelect
    });

    return ok({ income });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { groupId: string; incomeId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const income = await prisma.income.findFirst({
      where: { id: params.incomeId, groupId: params.groupId }
    });

    if (!income) {
      return fail("Receita não encontrada", 404);
    }

    const mode = request.nextUrl.searchParams.get("mode") ?? "single";

    if (mode === "remaining" && income.recurringRef) {
      await prisma.income.deleteMany({
        where: {
          recurringRef: income.recurringRef,
          recurringNum: { gte: income.recurringNum ?? 1 }
        }
      });
    } else if (mode === "all" && income.recurringRef) {
      await prisma.income.deleteMany({ where: { recurringRef: income.recurringRef } });
    } else {
      await prisma.income.delete({ where: { id: params.incomeId } });
    }

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
