import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signCustomerGalleryToken, GALLERY_COOKIE_PREFIX } from "@/lib/auth";
import { z } from "zod";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const verifyPinSchema = z.object({
  slug: z.string().min(1),
  pin: z.string().length(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyPinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { slug, pin } = parsed.data;

    const gallery = await prisma.gallery.findUnique({
      where: { slug },
    });

    if (!gallery || !gallery.isPublished) {
      return NextResponse.json({ error: "Gallery not found or not published" }, { status: 404 });
    }

    const isPinValid = await bcrypt.compare(pin, gallery.pinHash);
    if (!isPinValid) {
      return NextResponse.json({ error: "Incorrect 6-digit PIN" }, { status: 401 });
    }

    const token = await signCustomerGalleryToken(slug);

    const response = NextResponse.json({ success: true, slug });

    response.cookies.set(`${GALLERY_COOKIE_PREFIX}${slug}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12, // 12 hours customer session
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "PIN verification failed" }, { status: 500 });
  }
}
