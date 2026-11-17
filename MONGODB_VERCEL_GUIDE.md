# MongoDB & Vercel Integration Guide

Complete guide for setting up MongoDB with Vercel for the AI-Powered Email Dashboard.

---

## 📋 Overview

This project uses:
- **MongoDB** (via Mongoose) as the primary database
- **Vercel** for deployment with serverless functions
- **Next.js 16** App Router with API routes

---

## 🔧 Local Development Setup

### 1. Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Groq API Key
- Google Cloud Project (for Gmail OAuth)

### 2. Environment Variables

Create `.env.local` in `email-dashboard/`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/email-assistant

# Groq AI
GROQ_API_KEY=your_groq_api_key_here

# Google OAuth (Gmail Integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Next.js
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Cron Security
CRON_SECRET=your_cron_secret_here
```

### 3. Start Development

```bash
cd email-dashboard
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ MongoDB Atlas Setup (Production)

### 1. Create Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project or select existing
3. Build a cluster (M0 Free tier works for development)
4. Choose cloud provider & region (recommend same as Vercel region: `us-east-1` / `iad1`)

### 2. Configure Network Access

**IP Access List:**
- Add `0.0.0.0/0` (Allow from anywhere) — *for Vercel serverless functions*
- Or add specific Vercel IP ranges (see below)

### 3. Create Database User

1. Database Access → Add New Database User
2. Username/Password authentication
3. Grant `Atlas Admin` or `Read/Write to any database`
4. Save credentials — you'll need these for the connection string

### 4. Get Connection String

1. Clusters → Connect → Connect your application
2. Driver: Node.js, Version: 6.7 or later
3. Copy the connection string:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/email-assistant?retryWrites=true&w=majority
```

**Important:** Replace `<password>` with your actual password. The database name (`email-assistant`) will be created automatically.

---

## 🚀 Vercel Deployment

### 1. Push to GitHub

```bash
cd email-dashboard
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/email-dashboard.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Vercel auto-detects Next.js — no build config changes needed

### 3. Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/email-assistant?retryWrites=true&w=majority` | Production, Preview, Development |
| `GROQ_API_KEY` | `gsk_...` | All |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | All |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | All |
| `GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/callback/google` | Production, Preview |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | All |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production, Preview |
| `CRON_SECRET` | `openssl rand -base64 32` | All |

**Generate secrets locally:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32
```

### 4. Update Google OAuth

In Google Cloud Console → APIs & Services → Credentials:
- Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

### 5. Deploy

Click **Deploy** — Vercel will build and deploy automatically.

---

## ⚙️ Vercel Configuration (`vercel.ts`)

The project includes a `vercel.ts` config file:

```typescript
import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  buildCommand: 'npm run build',
  framework: 'nextjs',
  devCommand: 'npm run dev',
  installCommand: 'npm install',
  regions: ['iad1'],  // US East (N. Virginia) — closest to MongoDB Atlas us-east-1
  functions: {
    'src/app/api/**/*.ts': {
      maxDuration: 60,  // 60 seconds for email sync operations
    },
  },
  headers: [
    routes.cacheControl('/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
    routes.cacheControl('/_next/static/(.*)', { public: true, maxAge: '1 year', immutable: true }),
  ],
  rewrites: [
    routes.rewrite('/api/emails/(.*)', '/api/emails/$1'),
  ],
  crons: [
    { path: '/api/cron/sync-emails', schedule: '0 * * * *' }, // Every hour
  ],
  env: {
    MONGODB_URI: deploymentEnv('MONGODB_URI'),
    GROQ_API_KEY: deploymentEnv('GROQ_API_KEY'),
    GOOGLE_CLIENT_ID: deploymentEnv('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: deploymentEnv('GOOGLE_CLIENT_SECRET'),
    GOOGLE_REDIRECT_URI: deploymentEnv('GOOGLE_REDIRECT_URI'),
    NEXTAUTH_SECRET: deploymentEnv('NEXTAUTH_SECRET'),
    NEXTAUTH_URL: deploymentEnv('NEXTAUTH_URL'),
  },
};
```

### Key Configurations Explained

| Setting | Purpose |
|---------|---------|
| `regions: ['iad1']` | Deploys to US East for lowest latency to MongoDB Atlas us-east-1 |
| `functions.maxDuration: 60` | Allows 60s for Gmail API sync (default is 30s) |
| `crons` | Hourly email sync via `/api/cron/sync-emails` |
| `deploymentEnv()` | Securely references Vercel environment variables |

---

## 🔌 MongoDB Connection Pattern

The project uses a **cached connection** pattern optimized for serverless:

```typescript
// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
```

### Why This Pattern?

| Problem | Solution |
|---------|----------|
| Serverless cold starts create new connections | Global cache persists across invocations |
| Connection exhaustion | `maxPoolSize: 10` limits concurrent connections |
| `bufferCommands: false` | Fails fast if not connected (better error handling) |

### Usage in API Routes

```typescript
// src/app/api/emails/sync/route.ts
import connectDB from '@/lib/mongodb';
import Email from '@/lib/models/Email';

export async function GET() {
  await connectDB();  // Ensures connection before query
  const emails = await Email.find({}).sort({ date: -1 }).limit(50);
  return Response.json(emails);
}
```

---

## 📊 Database Models

### Email Model (`src/lib/models/Email.ts`)

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IEmail extends Document {
  messageId: string;
  threadId: string;
  accountId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  labels: string[];
  category: 'assistant-reply' | 'client-reply' | 'no-reply' | 'unclassified';
  isStarred: boolean;
  isRead: boolean;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  aiSummary?: string;
  aiActionItems?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<IEmail>({
  messageId: { type: String, required: true, unique: true },
  threadId: { type: String, required: true, index: true },
  accountId: { type: String, required: true, index: true },
  from: { type: String, required: true },
  to: [{ type: String }],
  subject: { type: String, required: true },
  body: { type: String, required: true },
  bodyHtml: String,
  date: { type: Date, required: true, index: true },
  labels: [{ type: String }],
  category: {
    type: String,
    enum: ['assistant-reply', 'client-reply', 'no-reply', 'unclassified'],
    default: 'unclassified',
    index: true,
  },
  isStarred: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  attachments: [{
    filename: String,
    mimeType: String,
    size: Number,
    attachmentId: String,
  }],
  aiSummary: String,
  aiActionItems: [String],
}, {
  timestamps: true,
});

// Compound indexes for common queries
EmailSchema.index({ accountId: 1, date: -1 });
EmailSchema.index({ accountId: 1, category: 1, date: -1 });
EmailSchema.index({ threadId: 1, date: -1 });

export default mongoose.models.Email || mongoose.model<IEmail>('Email', EmailSchema);
```

### EmailAccount Model (`src/lib/models/EmailAccount.ts`)

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailAccount extends Document {
  email: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailAccountSchema = new Schema<IEmailAccount>({
  email: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  lastSyncAt: Date,
}, {
  timestamps: true,
});

export default mongoose.models.EmailAccount || mongoose.model<IEmailAccount>('EmailAccount', EmailAccountSchema);
```

### ClientView Model (`src/lib/models/ClientView.ts`)

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IClientView extends Document {
  token: string;
  emailId: string;
  emailData: {
    from: string;
    subject: string;
    body: string;
    date: Date;
  };
  response?: string;
  respondedAt?: Date;
  viewedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const ClientViewSchema = new Schema<IClientView>({
  token: { type: String, required: true, unique: true, index: true },
  emailId: { type: String, required: true, index: true },
  emailData: {
    from: String,
    subject: String,
    body: String,
    date: Date,
  },
  response: String,
  respondedAt: Date,
  viewedAt: Date,
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL index
}, {
  timestamps: true,
});

export default mongoose.models.ClientView || mongoose.model<IClientView>('ClientView', ClientViewSchema);
```

---

## 🔐 Security Best Practices

### 1. MongoDB Atlas Security

- **Network Access:** Use `0.0.0.0/0` for Vercel (serverless IPs are dynamic) OR configure [Vercel Static IPs](https://vercel.com/docs/concepts/functions/static-ip) (Pro+)
- **Database User:** Use least-privilege roles (Read/Write only)
- **Encryption:** Atlas encrypts at rest by default; enable TLS (enabled by default)

### 2. Environment Variables

- **Never commit `.env.local`** — it's in `.gitignore`
- Use Vercel's encrypted environment variables
- Rotate secrets periodically

### 3. Connection String Security

```env
# ✅ Good - password in env var
MONGODB_URI=mongodb+srv://user:${MONGO_PASSWORD}@cluster.mongodb.net/db

# ❌ Bad - password in connection string
MONGODB_URI=mongodb+srv://user:actualpassword@cluster.mongodb.net/db
```

---

## 🐛 Troubleshooting

### Connection Issues

| Error | Solution |
|-------|----------|
| `MONGODB_URI not defined` | Add `MONGODB_URI` to Vercel Environment Variables |
| `ECONNREFUSED` / `ETIMEDOUT` | Check Atlas Network Access (allow `0.0.0.0/0`) |
| `Authentication failed` | Verify username/password in connection string |
| `bufferCommands` timeout | Increase `maxDuration` in `vercel.ts` |

### Vercel Function Timeout

```typescript
// vercel.ts - increase if sync takes longer
functions: {
  'src/app/api/**/*.ts': {
    maxDuration: 60, // or 300 for Pro plan
  },
}
```

### Mongoose Connection Warning

```text
MongooseServerSelectionError: Could not connect to any servers
```

**Fix:** Ensure Atlas cluster is running (not paused) and IP allowlist includes Vercel.

### Cron Job Not Running

1. Check Vercel Dashboard → Project → Cron Jobs
2. Verify `CRON_SECRET` is set in Environment Variables
3. Ensure cron endpoint returns 200 within 60s

```bash
# Test cron manually
curl -X GET https://your-app.vercel.app/api/cron/sync-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📈 Performance Optimization

### 1. Connection Pooling

```typescript
// mongodb.ts - adjust based on traffic
const opts = {
  bufferCommands: false,
  maxPoolSize: 10,  // Increase for high traffic
  minPoolSize: 2,   // Keep warm connections
};
```

### 2. Indexes

All models include compound indexes for common query patterns:
- `accountId + date` — Inbox pagination
- `accountId + category + date` — Category views
- `threadId + date` — Thread view
- `token` (TTL) — Auto-expire client links

### 3. Query Optimization

```typescript
// ✅ Good - lean queries
const emails = await Email.find({ accountId })
  .select('subject from date category isStarred')
  .sort({ date: -1 })
  .limit(50)
  .lean();

// ❌ Bad - fetches full documents
const emails = await Email.find({ accountId });
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd email-dashboard && npm ci
      - run: cd email-dashboard && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
        if: github.ref == 'refs/heads/main'
```

---

## 📚 Useful Commands

```bash
# Local development
cd email-dashboard
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
# Connect to local MongoDB
mongosh mongodb://localhost:27017/email-assistant

# Connect to Atlas
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/email-assistant" --username user

# Vercel CLI
vercel login
vercel link          # Link local project
vercel env pull      # Pull env vars locally
vercel deploy        # Preview deploy
vercel deploy --prod # Production deploy
vercel logs          # View function logs
```

---

## 🔗 Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Mongoose Connection Best Practices](https://mongoosejs.com/docs/connections.html)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Vercel Cron Jobs](https://vercel.com/docs/concepts/deployments/cron-jobs)

---

## ✅ Quick Checklist

### Pre-Deployment
- [ ] MongoDB Atlas cluster created
- [ ] Network Access: `0.0.0.0/0` allowed
- [ ] Database user created with Read/Write
- [ ] Connection string tested locally

### Vercel Setup
- [ ] Repository imported
- [ ] All environment variables added
- [ ] `GOOGLE_REDIRECT_URI` updated to production URL
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] Cron secret generated and added

### Post-Deployment
- [ ] First deploy successful
- [ ] Cron job appears in Vercel dashboard
- [ ] Email sync works manually
- [ ] Client response flow tested
- [ ] AI classification working

---

*Guide created for AI-Powered Personal Assistant Email Dashboard — Built with Next.js 16, MongoDB, Vercel, and Groq AI*