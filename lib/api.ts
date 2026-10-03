import { Prisma, PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthUser, canManageGroup, getMembership, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

export function handleError(error: unknown) {
  console.error(error);

  if (error instanceof ZodError) {
    return fail("Dados inválidos", 422, error.flatten());
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return fail("Registro duplicado", 409);
  }

  return fail("Erro interno do servidor", 500);
}

export async function parseJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function withAuth(request: NextRequest): Promise<AuthUser | NextResponse> {
  const user = await requireAuth(request);
  if (!user) {
    return fail("Não autenticado", 401);
  }

  return user;
}

export async function withGroupMember(request: NextRequest, groupId: string) {
  const user = await withAuth(request);
  if (user instanceof NextResponse) {
    return { response: user };
  }

  const membership = await getMembership(user.id, groupId);
  if (!membership) {
    return { response: fail("Você não é membro deste grupo", 403) };
  }

  return { user, membership };
}

export async function withGroupManager(request: NextRequest, groupId: string) {
  const context = await withGroupMember(request, groupId);
  if ("response" in context) {
    return context;
  }

  if (!canManageGroup(context.membership.role)) {
    return { response: fail("Apenas owners e admins podem executar esta ação", 403) };
  }

  return context;
}

export async function withGroupOwner(request: NextRequest, groupId: string) {
  const context = await withGroupMember(request, groupId);
  if ("response" in context) {
    return context;
  }

  if (context.membership.role !== "OWNER") {
    return { response: fail("Apenas o dono do grupo pode executar esta ação", 403) };
  }

  return context;
}

export async function assertGroupMember(userId: string, groupId: string, db: PrismaClient | Prisma.TransactionClient = prisma) {
  const membership = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    }
  });

  return Boolean(membership);
}

export const defaultIncomeCategories = [
  { name: "Salário", color: "#B8F0D4", type: "INCOME" as const },
  { name: "Freelance", color: "#C2E4FF", type: "INCOME" as const },
  { name: "Investimentos", color: "#D4C5F9", type: "INCOME" as const },
  { name: "Outros", color: "#FFF0A0", type: "INCOME" as const }
];

export const defaultExpenseCategories = [
  { name: "Contas", color: "#C2E4FF", type: "EXPENSE" as const },
  { name: "Lazer", color: "#FFD6C0", type: "EXPENSE" as const },
  { name: "Alimentação", color: "#FFCCE0", type: "EXPENSE" as const },
  { name: "Transporte", color: "#FFF0A0", type: "EXPENSE" as const },
  { name: "Saúde", color: "#B8F0D4", type: "EXPENSE" as const },
  { name: "Outros", color: "#D4C5F9", type: "EXPENSE" as const }
];
