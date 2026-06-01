# RESTDIGI

RESTDIGI is a real-time digital menu, contactless table self-ordering, and local SEO discovery framework built for modern restaurants.

## Key Capabilities

### For Customers
* **Instant Digital Menu**: Responsive mobile-first interface optimized for fast loading and clear category navigation.
* **Table Self-Ordering (KOT)**: Diners place orders directly by scanning table QR codes, routing tickets straight to the kitchen.
* **Order Telemetry**: Live order tracking (Pending -> Preparing -> Served) in the browser.

### For Restaurant Admins
* **Live Order Queue & Kitchen Display**: Real-time order dispatch board with sound alerts to notify kitchen staff of modifications.
* **Menu Management**: Update items, pricing, and availability states instantly.
* **Advanced Metrics Dashboard**: Telemetry dashboard tracking scan velocities, weekly top-performing dishes, and item view graphs.
* **Flexible Subscriptions**: A 4-tier plan layout (Basic, Pro, Premium, Enterprise) with an annual cycle toggle and modal-driven cancellation flows.
* **Automated Marketing Cron**: Bi-weekly nurturing sequences optimized for primary inbox delivery to drive upgrade conversions.

### Search Engine Optimization (SEO)
* **Local SEO Schema**: Integrated Google schema structure (`SoftwareApplication`) and layout metadata canonical bindings.
* **Sitemap Generation**: Programmatic sitemap updating daily, indexing paid outlet catalogs (`pro`, `premium`, `enterprise`) to optimize crawl indexing priority.

## Tech Stack
* **Framework**: Next.js 14 (App Router)
* **Styling**: Tailwind CSS
* **Database & Realtime**: Supabase (PostgreSQL, Realtime Broadcast)
* **Gateway Payments**: Razorpay Integration
* **API Providers**: Brevo (SMTP/Transac email delivery)

## Getting Started

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Add environment config in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   BREVO_API_KEY=your_brevo_api_key
   CRON_SECRET=your_cron_secret_token
   ```

3. Run local dev server:
   ```bash
   npm run dev
   ```
