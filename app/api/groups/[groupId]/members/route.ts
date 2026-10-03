import { NextRequest } from "next/server";
import { handleError, ok, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId: params.groupId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" }
    });

    return ok({ members });
  } catch (error) {
    return handleError(error);
  }
}
