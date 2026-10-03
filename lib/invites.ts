import { prisma } from "@/lib/prisma";

/** Resolve o grupo de um convite. Apenas links temporários ainda válidos são aceitos. */
export async function resolveInviteGroup(token: string) {
  const group = await prisma.group.findUnique({
    where: { timedInviteToken: token },
    select: { id: true, name: true, description: true, timedInviteExpiresAt: true }
  });

  if (group && group.timedInviteExpiresAt && group.timedInviteExpiresAt > new Date()) {
    return { id: group.id, name: group.name, description: group.description };
  }

  return null;
}
