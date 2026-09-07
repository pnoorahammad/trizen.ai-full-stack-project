import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Database Seed...");

  // Clean existing data
  await prisma.photo.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.eventMember.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Create Passwords
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const adminDemoPassword = await bcrypt.hash("Admin@12345", 10);
  const teamPassword = await bcrypt.hash("Team@123", 10);
  const memberDemoPassword = await bcrypt.hash("Member@12345", 10);

  // 1. Admin Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@trizen.com",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@demo.com",
      passwordHash: adminDemoPassword,
      role: Role.ADMIN,
    },
  });

  // 2. Team Member Users
  const teamMember = await prisma.user.create({
    data: {
      email: "team@trizen.com",
      passwordHash: teamPassword,
      role: Role.TEAM_MEMBER,
    },
  });

  await prisma.user.create({
    data: {
      email: "member@demo.com",
      passwordHash: memberDemoPassword,
      role: Role.TEAM_MEMBER,
    },
  });

  console.log("✅ Seeded Users (Admins & Team Members)");

  // 3. Sample Event: "Arjun & Priya Wedding"
  const weddingEvent = await prisma.event.create({
    data: {
      title: "Arjun & Priya Wedding",
      description: "Grand Destination Wedding Ceremony & Reception",
      date: new Date("2026-09-15"),
      createdById: admin.id,
    },
  });

  // Assign Team Member to Event
  await prisma.eventMember.create({
    data: {
      eventId: weddingEvent.id,
      userId: teamMember.id,
    },
  });

  console.log("✅ Seeded Event and Assigned Team Member");

  // Sample photo URLs from Unsplash (High Quality Wedding Photos)
  const samplePhotos = [
    {
      filename: "wedding_ceremony_01.jpg",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200",
      storageKey: "wedding/ceremony_01.jpg",
      isSelectedForGallery: true,
      mimeType: "image/jpeg",
      fileSize: 2450000,
    },
    {
      filename: "bride_portrait_02.jpg",
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200",
      storageKey: "wedding/bride_02.jpg",
      isSelectedForGallery: true,
      mimeType: "image/jpeg",
      fileSize: 3100000,
    },
    {
      filename: "couple_ring_exchange.jpg",
      url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=1200",
      storageKey: "wedding/rings_03.jpg",
      isSelectedForGallery: true,
      mimeType: "image/jpeg",
      fileSize: 1890000,
    },
    {
      filename: "reception_stage_decor.jpg",
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200",
      storageKey: "wedding/reception_04.jpg",
      isSelectedForGallery: true,
      mimeType: "image/jpeg",
      fileSize: 2750000,
    },
    {
      filename: "raw_behind_the_scenes_05.jpg",
      url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200",
      storageKey: "wedding/bts_05.jpg",
      isSelectedForGallery: false, // Unselected photo
      mimeType: "image/jpeg",
      fileSize: 1400000,
    },
    {
      filename: "test_blur_shot_06.jpg",
      url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200",
      storageKey: "wedding/blur_06.jpg",
      isSelectedForGallery: false, // Unselected photo
      mimeType: "image/jpeg",
      fileSize: 980000,
    },
  ];

  for (const photo of samplePhotos) {
    await prisma.photo.create({
      data: {
        eventId: weddingEvent.id,
        uploadedById: teamMember.id,
        filename: photo.filename,
        url: photo.url,
        storageKey: photo.storageKey,
        isSelectedForGallery: photo.isSelectedForGallery,
        mimeType: photo.mimeType,
        fileSize: photo.fileSize,
      },
    });
  }

  console.log("✅ Seeded 6 Photos (4 Selected, 2 Unselected)");

  // 4. Create Published Gallery
  const pin482917 = await bcrypt.hash("482917", 10);
  await prisma.gallery.create({
    data: {
      eventId: weddingEvent.id,
      slug: "wedding-preview",
      pinHash: pin482917,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  const pin123456 = await bcrypt.hash("123456", 10);
  const demoEvent = await prisma.event.create({
    data: {
      title: "Rahul & Sneha Pre-Wedding",
      description: "Pre-Wedding Shoot at Royal Palace",
      date: new Date("2026-08-20"),
      createdById: admin.id,
    },
  });

  await prisma.eventMember.create({
    data: {
      eventId: demoEvent.id,
      userId: teamMember.id,
    },
  });

  await prisma.photo.create({
    data: {
      eventId: demoEvent.id,
      uploadedById: teamMember.id,
      filename: "palace_portrait_01.jpg",
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200",
      storageKey: "prewedding/palace_01.jpg",
      isSelectedForGallery: true,
      mimeType: "image/jpeg",
      fileSize: 2100000,
    },
  });

  await prisma.gallery.create({
    data: {
      eventId: demoEvent.id,
      slug: "demo-gallery",
      pinHash: pin123456,
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Seeded Published Galleries ('wedding-preview' [PIN: 482917], 'demo-gallery' [PIN: 123456])");
  console.log("🎉 Database Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
