import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const createEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  date: z.string().optional(),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let events;
  if (session.role === Role.ADMIN) {
    events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        gallery: true,
        members: { include: { user: { select: { id: true, email: true } } } },
        _count: { select: { photos: true } },
      },
    });
  } else {
    events = await prisma.event.findMany({
      where: {
        members: {
          some: {
            userId: session.userId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        gallery: true,
        members: { include: { user: { select: { id: true, email: true } } } },
        _count: { select: { photos: true } },
      },
    });
  }

  return NextResponse.json({ events });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
    }

    const { title, description, date } = parsed.data;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: date ? new Date(date) : new Date(),
        createdById: session.userId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
