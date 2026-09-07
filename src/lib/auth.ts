import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "trizen_secure_jwt_secret_key_2026_super_secret"
);

export interface UserSessionPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface CustomerSessionPayload {
  gallerySlug: string;
  authorized: boolean;
}

export const AUTH_COOKIE_NAME = "trizen_auth_token";
export const GALLERY_COOKIE_PREFIX = "trizen_gallery_access_";

export async function signUserToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyUserToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserSessionPayload;
  } catch (err) {
    return null;
  }
}

export async function signCustomerGalleryToken(gallerySlug: string): Promise<string> {
  return new SignJWT({ gallerySlug, authorized: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(JWT_SECRET);
}

export async function verifyCustomerGalleryToken(
  token: string,
  slug: string
): Promise<boolean> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as unknown as CustomerSessionPayload;
    return payload.authorized && payload.gallerySlug === slug;
  } catch (err) {
    return false;
  }
}

export async function getCurrentSession(req?: Request): Promise<UserSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
    if (match) token = match[1];
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // In standalone unit test context outside Next.js request store
    }
  }

  if (!token) return null;
  return verifyUserToken(token);
}

export async function getCustomerGalleryAccess(
  slug: string,
  req?: Request
): Promise<boolean> {
  let token: string | undefined;
  const cookieKey = `${GALLERY_COOKIE_PREFIX}${slug}`;

  if (req) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`${cookieKey}=([^;]+)`));
    if (match) token = match[1];
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(cookieKey)?.value;
    } catch {
      // In standalone unit test context outside Next.js request store
    }
  }

  if (!token) return false;
  return verifyCustomerGalleryToken(token, slug);
}
