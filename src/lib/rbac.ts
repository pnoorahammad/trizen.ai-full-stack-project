import { prisma } from "./prisma";
import { UserSessionPayload } from "./auth";
import { Role } from "@prisma/client";

export async function canUserAccessEvent(
  session: UserSessionPayload,
  eventId: string
): Promise<boolean> {
  if (session.role === Role.ADMIN) {
    return true;
  }

  if (session.role === Role.TEAM_MEMBER) {
    const membership = await prisma.eventMember.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: session.userId,
        },
      },
    });
    return !!membership;
  }

  return false;
}

export function isAdmin(session: UserSessionPayload): boolean {
  return session.role === Role.ADMIN;
}
