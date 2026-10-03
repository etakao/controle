import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, tokenCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(tokenCookie(), "", { maxAge: 0, path: "/" });
  return response;
}
