import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { attachAuthCookie, createSessionToken } from "@/lib/auth";
import { fail, handleError, ok, parseJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await parseJson(request));
    const account = await prisma.user.findUnique({ where: { email: body.email } });

    if (!account?.passwordHash) {
      return fail("Email ou senha inválidos", 401);
    }

    const passwordMatches = await bcrypt.compare(body.password, account.passwordHash);
    if (!passwordMatches) {
      return fail("Email ou senha inválidos", 401);
    }

    const user = {
      id: account.id,
      name: account.name,
      email: account.email
    };
    const { token, expiresAt } = await createSessionToken(user);

    return attachAuthCookie(ok({ user, token }), token, expiresAt);
  } catch (error) {
    return handleError(error);
  }
}
