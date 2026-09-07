import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePhotoSchema = z.object({
  isSelectedForGallery: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Strictly ONLY ADMIN can alter photo selection status
  if (!isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Admin access required to select photos" }, { status: 403 });
  }

  const { id: photoId } = await params;

  try {
    const body = await req.json();
    const parsed = updatePhotoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: parsed.data,
    });

    return NextResponse.json({ photo });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update photo status" }, { status: 500 });
  }
}

export async function DELETE(
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

  const { id: photoId } = await params;

  try {
    await prisma.photo.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
