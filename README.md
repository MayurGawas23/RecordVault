# RecordVault — Enterprise Full-Stack Archival Custody & Ledger System

[![Node.js](https://img.shields.io/badge/Backend-Node.js%20v18+-339933?logo=nodedotjs)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Framework-Express%20v4-000000?logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)](https://postgresql.org)
[![React](https://img.shields.io/badge/Frontend-React%20v18-61DAFB?logo=react)](https://reactjs.org)
[![AWS S3](https://img.shields.io/badge/Storage-AWS%20S3%20SDK%20v3-FF9900?logo=amazons3)](https://aws.amazon.com/s3)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)


**RecordVault**  features robust role-based access control (`USER` vs `ADMIN`), multi-file upload capabilities with binary magic-byte validation, pluggable storage adapters (**AWS S3** with presigned `PUT`/`GET` URLs and **Local Filesystem** fallback), a 30-day custodial soft-delete recovery vault, account lockout rate-limiting, and an email-based 6-digit numeric OTP password recovery mechanism with transactional Gmail SMTP delivery.

---

## 📄 SRS Specification Traceability Matrix (SRS v1.0)

This implementation fulfills all functional and non-functional requirements specified in the **Software Requirements Specification (SRS v1.0, 10 Sept 2026)**:

| SRS Requirement ID | Requirement Description | Implementation Module / Status |
| :--- | :--- | :--- |
| **FR-1.1 – FR-1.4** | User registration & Bcrypt password hashing | [AuthService.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/services/AuthService.js) (`bcrypt` 10-round salted hash) |
| **FR-1.5 – FR-1.6** | JWT authentication & 5-attempt account lockout | [authMiddleware.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/middleware/authMiddleware.js) & [LockoutCountdown.jsx](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Frontend/src/components/LockoutCountdown.jsx) |
| **FR-2.1 – FR-2.6** | Record creation & multi-file attachment upload | [RecordService.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/services/RecordService.js) & [AttachmentDropzone.jsx](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Frontend/src/components/AttachmentDropzone.jsx) |
| **FR-2.3 – FR-2.4** | Magic-byte file validation & executable rejection | [MagicBytesValidator.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/utils/MagicBytesValidator.js) (blocks `.exe`, `.bat`, `.sh`) |
| **FR-3.1 – FR-3.5** | Searchable/paginated list, owner isolation & preview | [Dashboard.jsx](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Frontend/src/pages/Dashboard.jsx) & [DocumentPreviewModal.jsx](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Frontend/src/components/DocumentPreviewModal.jsx) |
| **FR-4.1 – FR-4.4** | Metadata updates, attachment management & audit trail | [CreateEditRecordModal.jsx](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Frontend/src/components/CreateEditRecordModal.jsx) & [AuditService.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/services/AuditService.js) |
| **FR-5.1 – FR-5.4** | 30-Day Soft-Delete Recovery Vault & admin overrides | [RecoveryVault.jsx](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Frontend/src/pages/RecoveryVault.jsx) (`is_deleted` + 30-day recovery window) |
| **FR-6.1 – FR-6.13**| 6-Digit Email OTP password reset & generic responses | [OtpService.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/services/OtpService.js) & [EmailService.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/services/EmailService.js) |
| **NFR-4.1 – 4.5** | Security, 10,000-record performance (<2s SLA) & Pino audit | Database-level indexes, Pino structured log redaction |

---

## 🏛️ Architecture & Storage Strategy

RecordVault employs a **4-tier layered architecture** on the backend (`Routes` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Prisma Data Access Layer`) paired with a modern React SPA on the frontend.

```
RecordVault/
├── Frontend/             # React 18, Vite, React Router v6, TanStack Query, Axios, Vitest
└── Backend/              # Node.js, Express REST API, Prisma ORM (PostgreSQL), Pino, Jest
    ├── src/
    │   ├── config/       # Database connection & Pino Logger
    │   ├── controllers/  # Auth, Record, Admin, & Attachment controllers
    │   ├── middleware/   # JWT Auth, Validation, Rate Limiters
    │   ├── routes/       # Express API Router endpoints
    │   ├── services/     # Core Business Logic & Audit Trail
    │   ├── storage/      # Pluggable Storage Adapter Abstraction (S3 & Local)
    │   └── utils/        # Magic Bytes Inspection & Security Utilities
    └── prisma/           # Schema definitions, migrations, & benchmark seeder
```

### ☁️ Swappable Storage Adapter (`STORAGE_DRIVER`)
File storage is completely decoupled from business logic via the `StorageAdapter` contract ([StorageAdapter.js](file:///c:/Users/mayur/OneDrive/Desktop/RecordVault/Backend/src/storage/StorageAdapter.js)):

1. **AWS S3 Driver (`S3StorageAdapter.js`)**:
   - Uses **AWS SDK v3** (`@aws-sdk/client-s3` & `@aws-sdk/s3-request-presigner`).
   - **Direct Browser Uploads**: Issues presigned `PUT` URLs after backend validates magic bytes and file size limits.
   - **Presigned Downloads/Previews**: Generates short-lived (5-minute) presigned `GET` URLs upon authorized requests (`ADMIN` or record `owner_id`).
   - **UUID Key Formatting**: Stores object keys as `records/{recordId}/{uuid}-{sanitizedFileName}`.
2. **Local Filesystem Driver (`LocalStorageAdapter.js`)**:
   - Stores attachments on local disk (`./storage`) for seamless development without AWS credentials.

---

## 📊 High-Level Data Model (Prisma / PostgreSQL)

As defined in SRS Section 5:

- **`User`**: Primary user table storing name, email, Bcrypt `password_hash`, `role` (`USER` / `ADMIN`), `lockout_until` timestamp, and timestamps.
- **`Record`**: Main CRUD entity with `owner_id` FK, title, description, category, `status` (`active` / `archived`), `is_deleted` flag, `deleted_at` timestamp, and audit timestamps.
- **`Attachment`**: Uploaded file metadata linked via `record_id` FK storing `file_name`, `storage_path` (S3 object key or relative key), `file_size` (bytes), `mime_type`, and `uploaded_at`.
- **`PasswordResetOtp`**: 6-digit OTP codes linked via `user_id` FK storing Bcrypt `otp_hash`, `expires_at` (10-min TTL), `attempts` counter, and `is_used` boolean.
- **`AuditLog`**: Security and operations audit trail tracking `user_id`, `action`, `target_id`, `metadata`, and `created_at`.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** Database
- **AWS S3 Bucket** (Optional, required if `STORAGE_DRIVER=s3`)

---

### 1. Backend Configuration & Setup

```bash
cd Backend
npm install

# Copy environment template
cp .env.example .env
```

Edit your `Backend/.env` file to configure your local database and storage driver:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://mayur123:mayur123@localhost:5432/RecordVault?schema=public

JWT_SECRET=recordvault_jwt_access_secret_key_32chars!
JWT_REFRESH_SECRET=recordvault_jwt_refresh_secret_key_32chars!

# File Storage Configuration ('local' | 's3')
STORAGE_DRIVER=s3
AWS_REGION=eu-north-1
AWS_S3_BUCKET=record-vault
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# SMTP Email Delivery (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mayur.gawas4work@gmail.com
SMTP_PASS=your_16_digit_app_password
```

#### Run Database Migrations & Seed Benchmark Data:

```bash
# Execute Prisma Schema Migrations
npx prisma db push

# Seed Admin account, Standard Officer, and 10,000 benchmark records
node prisma/seed.js

# Start Backend server with hot-reload
npm run dev
```

The Backend API runs on **`http://localhost:5000`**.

---

### 2. Frontend Configuration & Setup

```bash
cd ../Frontend
npm install

# Start Vite development server
npm run dev
```

The Frontend application will launch at **`http://localhost:3000`** (or `http://localhost:5173`).

---

## 🔑 Default Credentials

- **Admin Account**: `mayurgawas0025@gmail.com` / `Admin123!`
- **Standard Officer**: `user@recordvault.internal` / `User1234!`
- **Secondary User**: `john@gmail.com` / `User1234!`

---

## 🧪 Testing & Quality Assurance

### Run Backend Unit & Storage Adapter Tests
```bash
cd Backend
npm test
```
*Executes Jest test suites covering `StorageFactory`, `LocalStorageAdapter`, `S3StorageAdapter` mocking, magic-byte validation, OTP rate-limiting, and Pino log redaction (16/16 tests passing).*

### Run Frontend Component Tests
```bash
cd Frontend
npm test
```
*Executes Vitest test suites covering `LockoutCountdown` live timers, `AttachmentDropzone`, segmented `OTPInputWidget`, and `PasswordInput` (10/10 tests passing).*

---

