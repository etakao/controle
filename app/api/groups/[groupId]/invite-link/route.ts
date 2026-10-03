import { NextRequest } from "next/server";
import { handleError, ok, withGroupOwner } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupOwner(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const group = await prisma.group.update({
      where: { id: params.groupId },
      data: { timedInviteToken: token, timedInviteExpiresAt: expiresAt },
      select: { timedInviteToken: true, timedInviteExpiresAt: true }
    });

    return ok({ token: group.timedInviteToken, expiresAt: group.timedInviteExpiresAt });
  } catch (error) {
    return handleError(error);
  }
}
