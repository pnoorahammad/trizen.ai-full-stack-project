import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { canUserAccessEvent } from "@/lib/rbac";
import { generatePresignedUploadUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const uploadUrlSchema = z.object({
  eventId: z.string().uuid(),
  filename: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().positive(),
});

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = uploadUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid upload request parameters" }, { status: 400 });
    }

    const { eventId, filename, fileType, fileSize } = parsed.data;

    const hasAccess = await canUserAccessEvent(session, eventId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: You are not assigned to this event" }, { status: 403 });
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `events/${eventId}/${Date.now()}_${sanitizedFilename}`;

    const { uploadUrl, publicUrl } = await generatePresignedUploadUrl(storageKey, fileType);

    const photo = await prisma.photo.create({
      data: {
        eventId,
        uploadedById: session.userId,
        storageKey,
        url: publicUrl,
        filename,
        fileSize,
        mimeType: fileType,
        isSelectedForGallery: false,
      },
    });

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      photoId: photo.id,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate pre-signed upload URL" }, { status: 500 });
  }
}
