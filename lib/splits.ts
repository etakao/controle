import { Prisma, SplitStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveSplitAmounts } from "@/lib/utils";

/**
 * Builds the split rows of one expense. The responsible already paid the expense,
 * so their own share is created as PAID.
 */
export function buildSplitRows(
  expenseId: string,
  responsibleId: string,
  amount: number,
  splits: { userId: string; amount?: number }[]
): Prisma.ExpenseSplitCreateManyInput[] {
  const amounts = resolveSplitAmounts(amount, splits);
  const paidAt = new Date();

  return splits.map((split, index) => {
    const isResponsible = split.userId === responsibleId;
    return {
      expenseId,
      userId: split.userId,
      amount: amounts[index],
      status: isResponsible ? SplitStatus.PAID : SplitStatus.PENDING,
      paidAt: isResponsible ? paidAt : null
    };
  });
}

/**
 * Keeps split statuses consistent after the responsible of some expenses changes:
 * the new responsible's share becomes PAID and the previous one's goes back to PENDING.
 */
export async function syncResponsibleSplits(
  expenseWhere: Prisma.ExpenseWhereInput,
  previousResponsibleId: string,
  newResponsibleId: string
) {
  if (previousResponsibleId === newResponsibleId) return;

  await prisma.$transaction([
    prisma.expenseSplit.updateMany({
      where: { expense: expenseWhere, userId: newResponsibleId, status: SplitStatus.PENDING },
      data: { status: SplitStatus.PAID, paidAt: new Date() }
    }),
    prisma.expenseSplit.updateMany({
      where: { expense: expenseWhere, userId: previousResponsibleId, status: SplitStatus.PAID },
      data: { status: SplitStatus.PENDING, paidAt: null }
    })
  ]);
}
