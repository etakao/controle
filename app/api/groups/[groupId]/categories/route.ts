import { NextRequest } from "next/server";
import { fail, handleError, ok, parseJson, withGroupManager, withGroupMember } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { categorySchema, categoryUpdateSchema } from "@/lib/validations/finance";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupMember(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const categories = await prisma.category.findMany({
      where: { groupId: params.groupId },
      orderBy: [{ type: "asc" }, { name: "asc" }]
    });

    return ok({ categories });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupManager(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const body = categorySchema.parse(await parseJson(request));
    const category = await prisma.category.create({
      data: {
        ...body,
        groupId: params.groupId
      }
    });

    return ok({ category }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const context = await withGroupManager(request, params.groupId);
    if ("response" in context) {
      return context.response;
    }

    const { id, ...body } = categoryUpdateSchema.parse(await parseJson(request));
    const current = await prisma.category.findFirst({
      where: { id, groupId: params.groupId }
    });

    if (!current) {
      return fail("Categoria não encontrada", 404);
    }

    const category = await prisma.category.update({
      where: { id },
      data: body
    });

    return ok({ category });
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

    const categoryId = request.nextUrl.searchParams.get("id");
    if (!categoryId) {
      return fail("Informe a categoria", 400);
    }

    const usage = await prisma.category.findFirst({
      where: { id: categoryId, groupId: params.groupId },
      include: {
        _count: {
          select: {
            incomes: true,
            expenses: true
          }
        }
      }
    });

    if (!usage) {
      return fail("Categoria não encontrada", 404);
    }

    if (usage._count.incomes > 0 || usage._count.expenses > 0) {
      return fail("Não é possível remover categoria com registros associados", 409);
    }

    await prisma.category.delete({ where: { id: categoryId } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
