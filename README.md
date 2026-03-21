# 💍 Wedding RSVP & Guest Management Platform

A full-stack web application for Indian wedding planners to manage guests, send personalised invites, track RSVPs, assign seating and accommodation, and run on-day check-in — all from a single dashboard.

**Live Demo:** [wedding-rsvps-37xg.vercel.app](https://wedding-rsvps-37xg.vercel.app) &nbsp;·&nbsp; **Stack:** Next.js 16 · Supabase · Twilio · Resend · Tailwind CSS

---

## ✨ Features

| Module | What it does |
|---|---|
| **Guest Management** | Add, edit, delete guests; tag by group; mark outstation; bulk import via CSV |
| **Invite Dispatch** | Send personalised WhatsApp (Twilio) or email (Resend) invites with a unique RSVP link per guest |
| **RSVP Tracking** | Live dashboard showing confirmed / declined / pending counts with meal preference breakdown |
| **Seating Plan** | Create tables per function (Mehendi, Sangeet, Reception); assign guests; visual seat occupancy |
| **Accommodation** | Add hotel rooms; assign outstation guests; track capacity and availability |
| **QR Check-In** | Per-guest QR codes for contactless self-check-in on the day; staff dashboard with live counts |
| **Analytics** | Charts for RSVP status, meal preferences, group breakdown; F&B report export as `.xlsx` |
| **CRM Sync** | Push guest data to an external CRM via webhook |
| **Digital Invite Cards** | AI-assisted and manual invite card builder; export as PNG; bulk send |
| **Multi-Function Events** | Model Mehendi, Sangeet, Baraat, Reception as separate sub-events under one wedding |

---

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router, React Server Components, API Routes)
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security + @supabase/ssr)
- **Styling:** Tailwind CSS 3 with custom Indian wedding design tokens
- **UI:** shadcn/ui + Radix UI + Lucide React
- **WhatsApp:** Twilio (sandbox; WhatsApp Business API approval pending)
- **Email:** Resend (HTML templates)
- **Charts:** Recharts 3
- **QR Codes:** `qrcode` npm package
- **CSV Import:** PapaParse
- **Excel Export:** SheetJS (xlsx)
- **Hosting:** Vercel

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Twilio](https://twilio.com) account with WhatsApp sandbox enabled
- A [Resend](https://resend.com) account

### 1. Clone the repo

```bash
git clone https://github.com/VedanshTyagi/wedding_rsvp.git
cd wedding_rsvp
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=+14155238886

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Wedding details
COUPLE_NAMES=couple-name
COUPLE_EMAIL=contact@yourdomain.com

# App URL (use http://localhost:3000 for local dev)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> ⚠️ Never commit `.env.local` to source control. The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser.

### 3. Set up the database

Run the schema SQL in your Supabase SQL editor to create the required tables:

```sql
-- Weddings
create table weddings (
  id uuid primary key default gen_random_uuid(),
  planner_id uuid references auth.users(id),
  couple_names text,
  date date,
  venue text,
  created_at timestamptz default now()
);

-- RLS
alter table weddings enable row level security;
create policy "Planners see own weddings" on weddings
  for all using (auth.uid() = planner_id);

-- Guests
create table guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  group_tag text,
  preferred_channel text default 'whatsapp',
  invite_token uuid default gen_random_uuid(),
  rsvp_status text default 'pending',
  meal_pref text,
  dietary_notes text,
  is_outstation boolean default false,
  created_at timestamptz default now()
);

-- Wedding functions / sub-events
create table wedding_functions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  name text,
  date date,
  venue text
);

-- Seating
create table seating_tables (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  table_name text,
  capacity int default 8,
  function_id uuid references wedding_functions(id),
  notes text,
  created_at timestamptz default now()
);

create table seating_assignments (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references seating_tables(id) on delete cascade,
  guest_id uuid references guests(id) on delete cascade
);

-- Accommodation
create table rooms (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid references weddings(id) on delete cascade,
  room_number text,
  capacity int default 2,
  room_type text default 'double',
  check_in_date date,
  check_out_date date,
  notes text
);

create table room_assignments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  guest_id uuid references guests(id) on delete cascade
);

-- Check-in log
create table checkin_log (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id),
  wedding_id uuid references weddings(id),
  checked_in_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Delivery log
create table delivery_log (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid references guests(id),
  channel text,
  status text,
  meta jsonb,
  error_message text,
  sent_at timestamptz default now()
);
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up for a planner account.

---

## 📁 Project Structure

```
app/
├── api/
│   ├── invite/send/          # WhatsApp + email invite dispatcher
│   ├── remind/               # Reminder sender
│   ├── rsvp/                 # Public RSVP read/write
│   ├── export/fnb/           # F&B Excel export
│   ├── crm-sync/             # CRM webhook sync
│   └── weddings/[weddingId]/
│       ├── guests/           # Guest CRUD + CSV import
│       ├── rooms/            # Room management
│       ├── accommodation/    # Room assignments
│       ├── functions/        # Wedding sub-events
│       └── crm/              # CRM settings
├── dashboard/
│   ├── page.jsx              # Wedding list
│   └── [weddingId]/
│       ├── guests/           # Guest list + import
│       ├── invites/send/     # Send invites UI
│       ├── rsvp/             # Live RSVP tracker
│       ├── seating/          # Seating plan
│       ├── accommodation/    # Room manager
│       ├── checkin/          # Staff + self check-in
│       ├── analytics/        # Charts + F&B export
│       └── crm/              # CRM integration
├── rsvp/                     # Public guest RSVP form
└── invite/[token]/           # Tokenised invite landing page

components/                   # Shared UI components
lib/supabase/                 # Server + client Supabase factories
middleware.js                 # Auth guard for /dashboard
```

---

## 🔐 How Authentication Works

- **Planners** sign in via Supabase Auth (email + password)
- Next.js Edge middleware redirects all unauthenticated `/dashboard` requests to `/login`
- Sessions are stored in HTTP-only cookies via `@supabase/ssr`
- **Guests** authenticate via a UUID token in their RSVP link — no account required

---

## 📲 WhatsApp Setup (Twilio Sandbox)

1. Go to your [Twilio Console](https://console.twilio.com) → Messaging → Try it out → Send a WhatsApp message
2. Note your sandbox number and join keyword
3. During testing, each guest must send `join <keyword>` to the sandbox number before they can receive messages
4. For production, apply for [WhatsApp Business API](https://www.twilio.com/whatsapp) through Meta

---

## 📧 Email Setup (Resend)

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain under **Domains**
3. Create an API key and set it as `RESEND_API_KEY`
4. Set `RESEND_FROM_EMAIL` to a verified address on your domain

Without domain verification, emails will be sent from Resend's shared domain and may be marked as spam.

---

## 🌐 Deploying to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in the Vercel dashboard under **Settings → Environment Variables**
4. Set `NEXT_PUBLIC_BASE_URL` to your Vercel deployment URL (e.g. `https://yourapp.vercel.app`)
5. Deploy — Vercel will auto-deploy on every push to `main`

> Without `NEXT_PUBLIC_BASE_URL` set to your Vercel URL, RSVP links in WhatsApp messages will contain `localhost` and will not work for guests on mobile.

---

## 🗺 Roadmap

- [ ] Drag-and-drop seating plan builder
- [ ] Dynamic Indian wedding digital invite card (SVG → React component)
- [ ] WhatsApp Business API production approval
- [ ] Custom domain email verification (Resend)
- [ ] Automated RSVP reminder scheduling
- [ ] Multi-planner team access with roles
- [ ] Guest portal — update RSVP after submission
- [ ] React Native mobile app for on-day check-in
- [ ] Vendor management module
- [ ] AI-powered seating suggestions

---

## 🎨 Design System

| Token | Color | Usage |
|---|---|---|
| `crimson` | `#9A2143` | Primary actions, active states |
| `gold` | `#BFA054` | Accents, borders, progress |
| `sand` | `#EDD498` | Secondary highlights |
| `cream` | `#FBF8F2` | Page and input backgrounds |
| `navy` | `#2C1810` | Headings, primary text |
| `steel` | `#9E8878` | Secondary text, labels |

Font: **Cormorant Garamond** (display serif) loaded via Google Fonts.

---

## 📄 License

Private repository — all rights reserved. Contact the author for licensing enquiries.

---

<p align="center">Built with ❤️ for Indian weddings &nbsp;·&nbsp; <a href="https://github.com/VedanshTyagi/wedding_rsvp">github.com/VedanshTyagi/wedding_rsvp</a></p>
