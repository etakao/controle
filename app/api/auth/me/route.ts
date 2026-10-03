import { NextRequest } from "next/server";
import { fail, handleError, ok, withAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request);
    if (auth instanceof Response) {
      return auth;
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        memberships: {
          select: {
            role: true,
            joinedAt: true,
            group: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,
                updatedAt: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return fail("Usuário não encontrado", 404);
    }

    return ok({ user });
  } catch (error) {
    return handleError(error);
  }
}
