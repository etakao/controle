import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { attachAuthCookie, createSessionToken } from "@/lib/auth";
import { fail, handleError, ok, parseJson } from "@/lib/api";
import { resolveInviteGroup } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const registerWithInviteSchema = registerSchema.extend({
  inviteToken: z.string().min(1, "Convite obrigatorio")
});

export async function POST(request: NextRequest) {
  try {
    const body = registerWithInviteSchema.parse(await parseJson(request));
    const group = await resolveInviteGroup(body.inviteToken);

    if (!group) {
      return fail("Cadastro disponivel apenas por convite valido", 403);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });

    if (existingUser) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: body.name,
          email: body.email,
          passwordHash
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      await tx.groupMember.create({
        data: {
          userId: createdUser.id,
          groupId: group.id,
          role: "MEMBER"
        }
      });

      return createdUser;
    });

    const { token, expiresAt } = await createSessionToken(user);
    return attachAuthCookie(ok({ user, token, groupId: group.id }, 201), token, expiresAt);
  } catch (error) {
    return handleError(error);
  }
}
