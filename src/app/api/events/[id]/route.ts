import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { canUserAccessEvent, isAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const assignMemberSchema = z.object({
  userId: z.string().uuid(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const hasAccess = await canUserAccessEvent(session, eventId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden: No access to this event" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      gallery: true,
      members: {
        include: { user: { select: { id: true, email: true, role: true } } },
      },
      photos: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, email: true } },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { id: eventId } = await params;

  try {
    const body = await req.json();
    const parsed = assignMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const { userId } = parsed.data;

    const membership = await prisma.eventMember.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: { eventId, userId },
      update: {},
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to assign member" }, { status: 500 });
  }
}
