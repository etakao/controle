import { NextRequest } from "next/server";
import { fail, handleError, ok, parseJson, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { splitUpdateSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string; splitId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const split = await prisma.expenseSplit.findUnique({
      where: { id: params.splitId },
      include: { expense: true }
    });

    if (!split || split.expense.groupId !== params.groupId) {
      return fail("Divisão não encontrada", 404);
    }

    // Each person controls the payment of their own share only
    if (split.userId !== context.user.id) {
      return fail("Você só pode alterar o pagamento da sua parte", 403);
    }

    if (split.expense.responsibleId === context.user.id) {
      return fail("Responsável pela despesa já tem sua parte paga", 422);
    }

    const body = splitUpdateSchema.parse(await parseJson(request));
    const updated = await prisma.expenseSplit.update({
      where: { id: params.splitId },
      data: {
        status: body.status,
        paidAt: body.status === "PAID" ? new Date() : null
      }
    });

    return ok({ split: updated });
  } catch (error) {
    return handleError(error);
  }
}
