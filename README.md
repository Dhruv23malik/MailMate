# AI-Powered Personal Assistant Email Dashboard

A modern, intelligent email management dashboard for personal assistants managing multiple clients' emails. Built with Next.js 15, TypeScript, Tailwind CSS, and AI-powered classification via Groq.

## Features

### Core Features
- **Multi-Account Email Integration** - Connect multiple Gmail accounts via OAuth
- **AI-Powered Classification** - Automatically categorize emails into:
  - 🤖 **Assistant Reply** - Assistant can respond on client's behalf
  - 👤 **Client Reply Required** - Client must respond personally
  - 📦 **No Reply Needed** - Notifications, FYI, automated emails
- **AI Query Interface** - Ask questions about emails ("Summarize this", "Extract action items", "Draft a reply")
- **Client-Facing Response Flow** - Secure, one-time links for clients to respond directly
- **Real-time Sync** - Hourly cron jobs sync emails from Gmail
- **Dark/Light Mode** - Full theme support with system preference detection

### UI/UX Highlights
- Clean, modern interface inspired by Superhuman and Linear
- Responsive three-panel layout (Sidebar → Email List → Detail View)
- Keyboard-friendly navigation
- Rich email previews with attachment support
- Real-time category counts and statistics
- Smooth animations and micro-interactions
- Accessible components built on Radix UI primitives

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui patterns
- **AI**: Groq SDK (Llama 3.3 70B)
- **Database**: MongoDB with Mongoose
- **Email**: Gmail API (googleapis)
- **Deployment**: Vercel (with vercel.ts config)
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Groq API Key
- Google Cloud Project (for Gmail OAuth)

### Installation

```bash
# Clone and install
cd email-dashboard
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

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

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── ai/query/      # AI query endpoint
│   │   ├── classify/      # Email classification
│   │   ├── emails/sync/   # Gmail sync
│   │   ├── client/[token]/ # Client response flow
│   │   └── cron/          # Scheduled jobs
│   ├── client/[token]/    # Client-facing response page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/
│   ├── email/             # Email-specific components
│   │   ├── Sidebar.tsx
│   │   ├── EmailCard.tsx
│   │   ├── EmailDetail.tsx
│   │   └── ClientView.tsx
│   └── ui/                # Reusable UI components
├── lib/
│   ├── ai.ts              # Groq AI integration
│   ├── email-sync.ts      # Gmail API sync
│   ├── mongodb.ts         # Database connection
│   ├── models/            # Mongoose models
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript types
```

## Key Features Explained

### Email Classification
The AI analyzes each email's content, sender, subject, and context to classify into three categories:

1. **Assistant Reply** - Routine operational emails, scheduling, confirmations
2. **Client Reply** - High-stakes, confidential, legal/financial decisions
3. **No Reply** - Notifications, newsletters, automated alerts

### AI Query Interface
Natural language queries about selected emails:
- "Summarize this email"
- "What action items are needed?"
- "Draft a professional reply"
- "Extract key details (dates, amounts, names)"

### Client Response Flow
1. Assistant marks email as "Client Reply Required"
2. System generates secure, one-time tokenized link
3. Client receives link via email (or assistant shares)
4. Client views original email context and responds
5. Response sent directly from client's email, assistant CC'd
6. Link expires after use or 7 days

### Dashboard Views
- **Inbox** - All emails with category badges
- **Starred** - Important flagged emails
- **Assistant Reply** - Emails assistant can handle
- **Client Reply** - Emails requiring client attention
- **No Reply** - Informational only
- **Unclassified** - Pending AI classification

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

The `vercel.ts` config handles:
- Function duration limits
- Cron jobs (hourly email sync)
- Edge caching headers
- Environment variable management

### Environment Variables for Production
```
MONGODB_URI=mongodb+srv://...
GROQ_API_KEY=gsk_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback/google
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.vercel.app
CRON_SECRET=...
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/query` | Query AI about emails |
| POST | `/api/classify` | Classify email(s) |
| POST | `/api/emails/sync` | Sync Gmail account |
| GET | `/api/emails/sync` | List connected accounts |
| GET | `/api/client/[token]` | Get client view data |
| POST | `/api/client/[token]/respond` | Submit client response |
| POST | `/api/client/[token]/view` | Track view |
| GET | `/api/cron/sync-emails` | Hourly sync (cron) |

## License

MIT License - Built for Humanity Founders Internship Assignment
