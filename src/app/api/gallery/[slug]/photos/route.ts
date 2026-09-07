import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerGalleryAccess } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Verify Gallery existence & publication
  const gallery = await prisma.gallery.findUnique({
    where: { slug },
    include: {
      event: {
        select: {
          title: true,
          description: true,
          date: true,
        },
      },
    },
  });

  if (!gallery || !gallery.isPublished) {
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  }

  // 2. Verify Customer PIN Session Cookie
  const isUnlocked = await getCustomerGalleryAccess(slug, req);
  if (!isUnlocked) {
    return NextResponse.json(
      {
        unlocked: false,
        event: {
          title: gallery.event.title,
          description: gallery.event.description,
          date: gallery.event.date,
        },
      },
      { status: 401 }
    );
  }

  // 3. Return ONLY photos where isSelectedForGallery === true
  const photos = await prisma.photo.findMany({
    where: {
      eventId: gallery.eventId,
      isSelectedForGallery: true, // Strict Security Guardrail
    },
    select: {
      id: true,
      url: true,
      filename: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    unlocked: true,
    event: gallery.event,
    photos,
  });
}
