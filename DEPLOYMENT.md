# RecordVault Multi-Platform Deployment Guide

This repository is pre-configured and tested for seamless deployment on **AWS**, **Render**, and **Vercel**.

---

## 1. AWS Deployment Options

### Option A: AWS EC2 / Docker Host (Recommended for Full Control)
1. **Connect to EC2**:
   ```bash
   ssh -i /path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```
2. **Clone Repository & Navigate**:
   ```bash
   git clone https://github.com/MayurGawas23/RecordVault.git
   cd RecordVault
   ```
3. **Configure Environment Variables**:
   Copy `.env.example` to `Backend/.env` and update values:
   ```bash
   cp Backend/.env.example Backend/.env
   nano Backend/.env
   ```
   Ensure:
   - `DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"`
   - `STORAGE_DRIVER="s3"`
   - `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` are configured.

4. **Launch with Docker Compose**:
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

### Option B: AWS Elastic Beanstalk / App Runner
- **Backend Service**: Deploy `Backend/` using Node.js 20 environment. Supply environment variables in the AWS console.
- **Frontend Service**: Deploy static build `Frontend/dist` or container build using `Frontend/Dockerfile`.

---

## 2. Render Deployment (Zero-Config Blueprint)

1. Connect your GitHub repository to **Render**.
2. Click **New +** -> **Blueprint**.
3. Point to `render.yaml` in this repository.
4. Fill in secret environment variables (`DATABASE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SMTP_PASS`, etc.) in the Render dashboard.
5. Click **Apply**. Render will automatically build, generate Prisma models, and run both Frontend and Backend web services.

---

## 3. Vercel Deployment (Frontend SPA)

1. Go to [Vercel Dashboard](https://vercel.com) and click **Add New Project**.
2. Import the `RecordVault` repository.
3. Set **Framework Preset** to `Vite`.
4. Set **Root Directory** to `Frontend` (or keep root with `vercel.json`).
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-backend-domain.com`
6. Click **Deploy**. Vercel will automatically handle client-side routing rewrites.

---

## Environment Variables Reference

| Variable | Description | Example / Note |
|---|---|---|
| `PORT` | Backend HTTP Port | `5000` |
| `NODE_ENV` | Runtime Environment | `production` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `DIRECT_URL` | Direct connection URL | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `STORAGE_DRIVER` | Storage mechanism | `s3` or `local` |
| `AWS_REGION` | AWS S3 Bucket Region | `eu-north-1` |
| `AWS_S3_BUCKET` | AWS S3 Bucket Name | `record-vault` |
| `JWT_SECRET` | Secret key for auth tokens | Standard random 64-char string |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Standard random 64-char string |
