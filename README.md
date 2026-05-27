# RESTDIGI

RESTDIGI is a real-time digital menu and contactless ordering system (KOT) for restaurants. Customers scan a table-specific QR code to browse the menu and place kitchen orders instantly, which sync in real-time to the admin order queue.

## Features

### For Customers
* **Instant Digital Menu**: Mobile-first, responsive interface with category navigation and dish availability states.
* **Table Ordering (KOT)**: Place orders directly from the table. Orders are instantly broadcasted to the kitchen dashboard.
* **Order Tracking**: Keep track of the order status (Pending -> Preparing -> Served) directly in the browser.

### For Restaurant Admin
* **Live Order Queue**: Track and update incoming KOT orders in real-time with automatic sound alerts.
* **Menu Management**: Add, edit, or delete dishes and update availability instantly.
* **Table Layout**: Manage restaurant table setups and download high-resolution QR codes for physical table stands.
* **Onboarding & Billing**: Complete restaurant setup via onboarding terms and select plans/trials.

## Tech Stack
* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS
* **Database & Auth**: Supabase (Postgres, Realtime broadcast/changes, Auth)
* **Components & Icons**: Lucide React, Framer Motion, Recharts

## Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* A Supabase project

### Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

3. **Database Schema:**
   Apply the SQL queries located in `supabase/schema.sql` to your Supabase project using the SQL Editor to set up the `restaurants`, `dishes`, `payments`, `tables`, and `orders` tables.

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production
To build the application for production:
```bash
npm run build
npm run start
```
