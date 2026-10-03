import { NextRequest } from "next/server";
import { fail, handleError, ok, withAuth } from "@/lib/api";
import { resolveInviteGroup } from "@/lib/invites";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const group = await resolveInviteGroup(params.token);
    if (!group) {
      return fail("Convite inválido ou expirado", 404);
    }

    return ok({ group });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const group = await resolveInviteGroup(params.token);
    if (!group) {
      return fail("Convite inválido ou expirado", 404);
    }

    await prisma.groupMember.upsert({
      where: {
        userId_groupId: {
          userId: auth.id,
          groupId: group.id
        }
      },
      update: {},
      create: {
        userId: auth.id,
        groupId: group.id,
        role: "MEMBER"
      }
    });

    return ok({ groupId: group.id });
  } catch (error) {
    return handleError(error);
  }
}
