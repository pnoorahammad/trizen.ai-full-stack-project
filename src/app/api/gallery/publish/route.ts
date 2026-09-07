import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const publishGallerySchema = z.object({
  eventId: z.string().uuid(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  pin: z.string().length(6, "PIN must be exactly 6 digits").regex(/^\d+$/, "PIN must be numeric"),
});

export async function POST(req: Request) {
  const session = await getCurrentSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strict RBAC: TEAM_MEMBER cannot publish gallery
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required to publish gallery" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = publishGallerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const { eventId, slug, pin } = parsed.data;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const gallery = await prisma.gallery.upsert({
      where: { eventId },
      create: {
        eventId,
        slug,
        pinHash,
        isPublished: true,
        publishedAt: new Date(),
      },
      update: {
        slug,
        pinHash,
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      gallery: {
        id: gallery.id,
        slug: gallery.slug,
        isPublished: gallery.isPublished,
        publishedAt: gallery.publishedAt,
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Gallery slug already exists. Choose another slug." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to publish gallery" }, { status: 500 });
  }
}
