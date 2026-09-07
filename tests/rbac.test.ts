import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { signUserToken } from "../src/lib/auth";

describe("Photo Sharing Platform - Security & Policy Suite", () => {
  let adminToken: string;
  let teamToken: string;
  let sampleEventId: string;
  let sampleGallerySlug = `test-security-wedding-${Date.now()}`;

  beforeAll(async () => {
    // 1. Ensure test users exist
    const adminUser = await prisma.user.upsert({
      where: { email: "test_admin@trizen.com" },
      create: {
        email: "test_admin@trizen.com",
        passwordHash: await bcrypt.hash("Pass123", 10),
        role: "ADMIN",
      },
      update: {},
    });

    const teamUser = await prisma.user.upsert({
      where: { email: "test_team@trizen.com" },
      create: {
        email: "test_team@trizen.com",
        passwordHash: await bcrypt.hash("Pass123", 10),
        role: "TEAM_MEMBER",
      },
      update: {},
    });

    adminToken = await signUserToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    teamToken = await signUserToken({
      userId: teamUser.id,
      email: teamUser.email,
      role: teamUser.role,
    });

    // 2. Setup Test Event
    const event = await prisma.event.create({
      data: {
        title: "Test Security Event",
        createdById: adminUser.id,
      },
    });
    sampleEventId = event.id;

    // 3. Setup Test Gallery
    const pinHash = await bcrypt.hash("482917", 10);
    await prisma.gallery.create({
      data: {
        eventId: sampleEventId,
        slug: sampleGallerySlug,
        pinHash,
        isPublished: true,
      },
    });

    // 4. Create sample selected and unselected photos
    await prisma.photo.createMany({
      data: [
        {
          eventId: sampleEventId,
          uploadedById: teamUser.id,
          filename: "selected.jpg",
          storageKey: `test/selected_${Date.now()}.jpg`,
          url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200",
          isSelectedForGallery: true,
        },
        {
          eventId: sampleEventId,
          uploadedById: teamUser.id,
          filename: "unselected.jpg",
          storageKey: `test/unselected_${Date.now()}.jpg`,
          url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200",
          isSelectedForGallery: false,
        },
      ],
    });
  });

  it("Guardrail 1: TEAM_MEMBER token cannot publish gallery (RBAC 403 enforcement)", async () => {
    const { POST: publishRoute } = await import("../src/app/api/gallery/publish/route");

    const req = new Request("http://localhost:3000/api/gallery/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `trizen_auth_token=${teamToken}`,
      },
      body: JSON.stringify({
        eventId: sampleEventId,
        slug: `unauthorized-slug-${Date.now()}`,
        pin: "123456",
      }),
    });

    const res = await publishRoute(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Forbidden");
  });

  it("Guardrail 2: Customer PIN Verification returns 401 on wrong PIN and 200 on correct PIN", async () => {
    const { POST: verifyPinRoute } = await import("../src/app/api/gallery/verify-pin/route");

    // Test Wrong PIN
    const wrongReq = new Request("http://localhost:3000/api/gallery/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: sampleGallerySlug, pin: "000000" }),
    });

    const wrongRes = await verifyPinRoute(wrongReq);
    expect(wrongRes.status).toBe(401);

    // Test Correct PIN (482917)
    const correctReq = new Request("http://localhost:3000/api/gallery/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: sampleGallerySlug, pin: "482917" }),
    });

    const correctRes = await verifyPinRoute(correctReq);
    expect(correctRes.status).toBe(200);
    const body = await correctRes.json();
    expect(body.success).toBe(true);
  });

  it("Guardrail 3: Public customer endpoint strictly hides unselected photos", async () => {
    const { GET: getCustomerPhotos } = await import("../src/app/api/gallery/[slug]/photos/route");

    const { signCustomerGalleryToken } = await import("../src/lib/auth");
    const customerToken = await signCustomerGalleryToken(sampleGallerySlug);

    const req = new Request(`http://localhost:3000/api/gallery/${sampleGallerySlug}/photos`, {
      method: "GET",
      headers: {
        Cookie: `trizen_gallery_access_${sampleGallerySlug}=${customerToken}`,
      },
    });

    const res = await getCustomerPhotos(req, { params: Promise.resolve({ slug: sampleGallerySlug }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.unlocked).toBe(true);
    expect(Array.isArray(data.photos)).toBe(true);

    // Verify ZERO unselected photos returned
    const unselectedPresent = data.photos.some((p: any) => p.filename === "unselected.jpg");
    expect(unselectedPresent).toBe(false);

    // Verify selected photo returned
    const selectedPresent = data.photos.some((p: any) => p.filename === "selected.jpg");
    expect(selectedPresent).toBe(true);
  });
});
