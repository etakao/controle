import { NextRequest } from "next/server";
import { fail, handleError, ok, parseJson, withGroupManager, withGroupMember, withGroupOwner } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        categories: { orderBy: [{ type: "asc" }, { name: "asc" }] }
      }
    });

    if (!group) {
      return fail("Grupo não encontrado", 404);
    }

    // inviteToken (link permanente) não é mais usado; o link temporário é visível apenas para o dono.
    const { inviteToken: _inviteToken, timedInviteToken, timedInviteExpiresAt, ...publicGroup } = group;
    if (context.membership.role !== "OWNER") {
      return ok({ group: publicGroup, role: context.membership.role });
    }

    return ok({ group: { ...publicGroup, timedInviteToken, timedInviteExpiresAt }, role: context.membership.role });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupOwner(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const body = groupSchema.partial().parse(await parseJson(request));
    const group = await prisma.group.update({
      where: { id: params.groupId },
      data: body
    });

    return ok({ group });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupManager(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    if (context.membership.role !== "OWNER") {
      return fail("Apenas o owner pode remover o grupo", 403);
    }

    await prisma.group.delete({ where: { id: params.groupId } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
