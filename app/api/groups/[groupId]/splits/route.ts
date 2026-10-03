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
    const status = request.nextUrl.searchParams.get("status");
    const splits = await prisma.expenseSplit.findMany({
      where: {
        userId: context.user.id,
        status: status === "PAID" || status === "PENDING" ? status : undefined,
        expense: {
          groupId: params.groupId,
          // Only debts: the user's share of expenses someone else paid
          responsibleId: { not: context.user.id },
          date: {
            gte: range.from,
            lte: range.to
          }
        }
      },
      select: {
        id: true,
        expenseId: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true } },
        expense: {
          include: {
            category: true,
            responsible: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return ok({
      splits,
      pendingTotal: splits.filter((s) => s.status === "PENDING").reduce((sum, s) => sum + Number(s.amount), 0),
      paidTotal: splits.filter((s) => s.status === "PAID").reduce((sum, s) => sum + Number(s.amount), 0),
      period: range
    });
  } catch (error) {
    return handleError(error);
  }
}
