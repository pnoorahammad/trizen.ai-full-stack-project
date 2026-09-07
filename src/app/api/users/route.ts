import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "TEAM_MEMBER"]),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getCurrentSession();
  if (!session || session.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid user creation data" }, { status: 400 });
    }

    const { email, password, role } = parsed.data;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: role as Role,
      },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
