import { cookies, headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

const tokenCookieName = "controle_token";
// Valores de exemplo que nunca devem ser usados como secret real.
const INSECURE_SECRETS = ["sua-chave-secreta-muito-longa-e-aleatoria", "troque-por-um-valor-aleatorio"];

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado");
  }
  if (secret.length < 32 || INSECURE_SECRETS.includes(secret)) {
    throw new Error("JWT_SECRET inseguro: use um valor aleatório com pelo menos 32 caracteres");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: AuthUser) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
    .sign(getJwtSecret());

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const data = payload as JwtPayload;

    if (!data.sub || !data.email || !data.name) {
      return null;
    }

    const session = await prisma.session.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: data.sub,
      email: data.email,
      name: data.name
    };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return request.cookies.get(tokenCookieName)?.value ?? null;
}

export async function getCurrentUser() {
  const cookieToken = cookies().get(tokenCookieName)?.value;
  const authorization = headers().get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : cookieToken;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireAuth(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function attachAuthCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(tokenCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });

  response.headers.set("Authorization", `Bearer ${token}`);
  return response;
}

export async function getMembership(userId: string, groupId: string) {
  return prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    }
  });
}

export function canManageGroup(role?: string) {
  return role === "OWNER" || role === "ADMIN";
}

export function tokenCookie() {
  return tokenCookieName;
}
