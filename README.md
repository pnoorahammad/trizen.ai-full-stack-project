# Trizen.ai Photo Sharing Platform 📸

A production-grade, secure, role-based photo sharing and curation platform engineered for photography agencies, photographers, and public customer viewing.

Repository: [https://github.com/pnoorahammad/trizen.ai-full-stack-project](https://github.com/pnoorahammad/trizen.ai-full-stack-project)

---

## 🌟 Architectural Features & Highlights

- **Direct-to-S3 Pre-Signed Upload Pipeline**: High-throughput file uploads directly from client browser to S3 storage bucket, bypassing serverless function execution limits.
- **Strict Role-Based Access Control (RBAC)**:
  - **ADMIN**: Full event lifecycle management, photographer assignment, photo curation (`isSelectedForGallery`), and gallery publishing with 6-digit PIN.
  - **TEAM_MEMBER**: View assigned events, upload raw photos, and inspect uploaded files. Unauthorized event or publish access returns HTTP 403 Forbidden.
- **PIN-Protected Customer Public Portal**:
  - Route: `/gallery/[slug]`
  - Customer authenticates using a 6-digit PIN code.
  - On verification, sets an HTTP-only signed JWT cookie.
  - Public query strictly filters `WHERE eventId = gallery.eventId AND isSelectedForGallery = true`. Unselected photos, database IDs, and photographer metadata are **never** leaked.
- **Automated Vitest Security Suite**: Unit tests validating RBAC 403 boundaries, PIN authentication (401 vs 200), and customer photo isolation.

---

## 🏗️ System Architecture & Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Photographer
    actor Customer as Public Client / Customer
    participant Frontend as Next.js 15 (App Router)
    participant Auth as JWT & Cookie Auth
    participant API as Next.js API Routes
    participant DB as PostgreSQL (Supabase/Neon)
    participant Storage as AWS S3 / Supabase Storage

    %% Direct S3 Upload Flow
    title Direct S3 Upload Pipeline
    Admin->>API: POST /api/photos/upload-url { eventId, filename, fileType, fileSize }
    API->>Auth: Verify Admin or Assigned Team Member
    Auth-->>API: Session Validated
    API->>Storage: Generate Pre-signed PUT URL (AWS SDK S3 Presigner)
    Storage-->>API: Presigned Upload URL
    API->>DB: Record Photo Metadata (isSelectedForGallery = false)
    API-->>Frontend: Return { uploadUrl, photoId }
    Frontend->>Storage: Direct PUT image binary to Storage Bucket
    Storage-->>Frontend: 200 OK Upload Success

    %% Gallery Publishing Flow
    title Gallery Publishing & Curation
    Admin->>API: PATCH /api/photos/[id] { isSelectedForGallery: true }
    API->>DB: Update Photo Selection Status
    Admin->>API: POST /api/gallery/publish { eventId, slug, pin }
    API->>Auth: Verify Role == ADMIN
    API->>DB: Upsert Gallery (pinHash = bcrypt(pin))
    API-->>Admin: Gallery Published Successfully

    %% Customer PIN Flow
    title Customer Public PIN Access Flow
    Customer->>Frontend: GET /gallery/wedding-preview
    Frontend->>API: GET /api/gallery/wedding-preview/photos
    API-->>Frontend: 401 Unauthorized (Requires PIN Verification)
    Customer->>Frontend: Enter 6-Digit PIN (482917)
    Frontend->>API: POST /api/gallery/verify-pin { slug, pin }
    API->>DB: Compare PIN against pinHash (bcrypt.compare)
    API-->>Frontend: 200 OK + Set HTTP-Only Cookie (trizen_gallery_access_slug)
    Customer->>Frontend: View Unlocked Gallery
    Frontend->>API: GET /api/gallery/wedding-preview/photos
    API->>DB: SELECT * FROM Photo WHERE isSelectedForGallery = true
    DB-->>API: Curated Photos Only
    API-->>Frontend: Return Highlights Array
```

---

## 🚀 Demo Credentials

### 1. Admin Portal (`/login`)
- **Email**: `admin@trizen.com` (or `admin@demo.com`)
- **Password**: `Admin@123` (or `Admin@12345`)
- **Capabilities**: Full Event CRUD, Member Assignment, Curation Grid Checkboxes, Publish Gallery with PIN.

### 2. Team Member Portal (`/login`)
- **Email**: `team@trizen.com` (or `member@demo.com`)
- **Password**: `Team@123` (or `Member@12345`)
- **Capabilities**: Upload photos to assigned events. Publishing or accessing unassigned events returns `403 Forbidden`.

### 3. Public Customer Gallery (`/gallery/wedding-preview`)
- **Public URL**: `/gallery/wedding-preview` (or `/gallery/demo-gallery`)
- **6-Digit Customer PIN**: `482917` (or `123456` for demo gallery)
- **Capabilities**: View curated photo highlights, open lightbox preview modal, download original photos.

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/pnoorahammad/trizen.ai-full-stack-project.git
cd trizen.ai-full-stack-project
npm install
```

### 2. Environment Configuration (`.env`)
Create a `.env` file in the project root:
```env
DATABASE_URL="postgresql://postgres.hclspmtuhffbukjgdxsy:Gharpayy%402026CRM%21@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.hclspmtuhffbukjgdxsy:Gharpayy%402026CRM%21@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

STORAGE_ENDPOINT="https://hclspmtuhffbukjgdxsy.storage.supabase.co/storage/v1/s3"
STORAGE_REGION="ap-south-1"
STORAGE_ACCESS_KEY_ID="your_access_key"
STORAGE_SECRET_ACCESS_KEY="your_secret_key"
STORAGE_BUCKET_NAME="event-photos"

JWT_SECRET="trizen_secure_jwt_secret_key_2026_super_secret"
```

### 3. Database Migration & Seed Data
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push

# Seed initial Admins, Team Members, Events, Photos, and PIN Galleries
npm run seed
```

### 4. Run Automated Security & Policy Tests
```bash
npm run test
```

### 5. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Security & Verification Matrix

| Requirement | Endpoint / Component | Test Guardrail Verification | Status |
| :--- | :--- | :--- | :---: |
| **Direct S3 Upload** | `POST /api/photos/upload-url` | Checks user assignment before issuing pre-signed URL | ✅ Verified |
| **Admin Curation** | `PATCH /api/photos/[id]` | Only `ADMIN` role can alter `isSelectedForGallery` | ✅ Verified |
| **RBAC Boundary** | `POST /api/gallery/publish` | `TEAM_MEMBER` token gets `403 Forbidden` | ✅ Tested (`vitest`) |
| **PIN Verification** | `POST /api/gallery/verify-pin` | Incorrect PIN returns `401`, Correct PIN sets signed cookie | ✅ Tested (`vitest`) |
| **Customer Isolation** | `GET /api/gallery/[slug]/photos` | Returns strictly `WHERE isSelectedForGallery = true` | ✅ Tested (`vitest`) |
