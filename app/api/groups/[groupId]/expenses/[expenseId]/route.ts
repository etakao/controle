import { NextRequest } from "next/server";
import { canManageGroup } from "@/lib/auth";
import { assertGroupMember, fail, handleError, ok, parseJson, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { syncResponsibleSplits } from "@/lib/splits";
import { expenseUpdateSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

const expenseSelect = {
  id: true,
  groupId: true,
  responsibleId: true,
  categoryId: true,
  amount: true,
  date: true,
  description: true,
  paymentMethod: true,
  installments: true,
  installmentRef: true,
  installmentNum: true,
  isRecurring: true,
  recurringFrequency: true,
  recurringInterval: true,
  recurringRef: true,
  recurringNum: true,
  recurringTotal: true
} as const;

async function canMutateExpense(userId: string, groupId: string, expenseId: string, role: string) {
  const expense = await prisma.expense.findFirst({ where: { id: expenseId, groupId } });
  if (!expense) {
    return { allowed: false, missing: true };
  }

  return { allowed: expense.responsibleId === userId || canManageGroup(role), expense };
}

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string; expenseId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const permission = await canMutateExpense(context.user.id, params.groupId, params.expenseId, context.membership.role);
    if (permission.missing) {
      return fail("Despesa não encontrada", 404);
    }
    if (!permission.allowed) {
      return fail("Você não pode editar esta despesa", 403);
    }

    const body = expenseUpdateSchema.parse(await parseJson(request));
    if (body.responsibleId) {
      const responsibleIsMember = await assertGroupMember(body.responsibleId, params.groupId);
      if (!responsibleIsMember) {
        return fail("Responsável não pertence ao grupo", 422);
      }
    }

    const current = permission.expense!;
    const mode = request.nextUrl.searchParams.get("mode") ?? "single";

    const updateData = {
      responsibleId: body.responsibleId ?? undefined,
      categoryId: body.categoryId === null ? null : (body.categoryId || undefined),
      amount: body.amount ?? undefined,
      date: body.date ?? undefined,
      description: body.description === null ? null : (body.description || undefined),
      paymentMethod: body.paymentMethod ?? undefined
    };

    if (mode === "all" && current.recurringRef) {
      const where = { recurringRef: current.recurringRef };
      await prisma.expense.updateMany({ where, data: { ...updateData, date: undefined } });
      if (body.responsibleId) await syncResponsibleSplits(where, current.responsibleId, body.responsibleId);
      const updated = await prisma.expense.findFirst({ where: { id: params.expenseId }, select: expenseSelect });
      return ok({ expense: updated });
    }

    if (mode === "from_now" && current.recurringRef) {
      const where = { recurringRef: current.recurringRef, date: { gte: current.date } };
      await prisma.expense.updateMany({ where, data: { ...updateData, date: undefined } });
      if (body.responsibleId) await syncResponsibleSplits(where, current.responsibleId, body.responsibleId);
      const updated = await prisma.expense.findFirst({ where: { id: params.expenseId }, select: expenseSelect });
      return ok({ expense: updated });
    }

    const expense = await prisma.expense.update({
      where: { id: params.expenseId },
      data: updateData,
      select: expenseSelect
    });
    if (body.responsibleId) await syncResponsibleSplits({ id: params.expenseId }, current.responsibleId, body.responsibleId);

    return ok({ expense });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { groupId: string; expenseId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const permission = await canMutateExpense(context.user.id, params.groupId, params.expenseId, context.membership.role);
    if (permission.missing || !permission.expense) {
      return fail("Despesa não encontrada", 404);
    }
    if (!permission.allowed) {
      return fail("Você não pode remover esta despesa", 403);
    }

    const mode = request.nextUrl.searchParams.get("mode") ?? "single";
    const expense = permission.expense;

    if (mode === "remaining" && expense.installmentRef) {
      await prisma.expense.deleteMany({
        where: {
          groupId: params.groupId,
          installmentRef: expense.installmentRef,
          installmentNum: { gte: expense.installmentNum ?? 1 }
        }
      });
    } else if (mode === "remaining" && expense.recurringRef) {
      await prisma.expense.deleteMany({
        where: {
          recurringRef: expense.recurringRef,
          recurringNum: { gte: expense.recurringNum ?? 1 }
        }
      });
    } else if (mode === "all" && expense.recurringRef) {
      await prisma.expense.deleteMany({ where: { recurringRef: expense.recurringRef } });
    } else {
      await prisma.expense.delete({ where: { id: params.expenseId } });
    }

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
