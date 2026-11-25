# ArPOS - Multi-Tenant Modular Restaurant Management Platform

ArPOS is a modular, multi-tenant restaurant POS and management platform built strictly according to the **Restaurant POS Platform Architecture, Modules, Technology Stack & Product Requirements (v1.0)**.

Designed for high-speed restaurant operations, offline resilience, and flexible deployment.

---

## 🚀 Key Features Built in This Prototype

1. **Cashier POS Terminal (`apps/cashier`)**:
   - **Catalog & Orders**: Category filter tabs, search, item cards, product variants (e.g. Regular/Jumbo, Hot/Iced), modifiers, custom order notes.
   - **Order Modes**: Dine In (with Table numbers) and Take Away (Bungkus).
   - **Accurate Financial Calculations**: Indonesian Rupiah (IDR) base integer math, automatic 5% Service Charge and 11% PB1 (Pajak Restoran).
   - **Payments**: Cash (with quick-tender buttons and live change calculation), Dynamic QRIS simulation, and EDC Card payments.
   - **ESC/POS 80mm Receipt Generator**: Formatted printable thermal receipt with itemized breakdown, tax/service summary, and store metadata.

2. **Cashier & Shift Management (`packages/utilities` & `apps/cashier`)**:
   - Implements Section 10.2 cash equation:
     $$\text{Expected cash} = \text{Opening cash} + \text{Cash sales} + \text{Cash in} - \text{Cash out} - \text{Cash refunds} - \text{Cash drops}$$
   - **Cash Movements**: Cash In (float replenishment) and Cash Out (petty cash / operational expenses).
   - **Blind Shift Closing**: Cashier enters physical cash count without seeing the expected cash beforehand. The system calculates exact discrepancy (Overage/Shortage/Exact) for managerial audit.

3. **Kitchen Display System (KDS)**:
   - Station-based routing (`Main Kitchen`, `Beverage Bar`).
   - Real-time ticket lifecycle: `Queued (Antri)` $\rightarrow$ `Preparing (Masak)` $\rightarrow$ `Ready (Siap Saji)` $\rightarrow$ `Completed (Disajikan)`.
   - Elapsed timer badges with visual color coding.

4. **Dynamic Module Registry & Entitlements**:
   - 12 business capability modules registered with a directed dependency graph.
   - Prevents invalid module combinations (e.g., Cashier POS requires Order Management and Payment Management).
   - Pre-configured restaurant operating profiles (Small Restaurant, Kitchen-Only KDS, Full-Service Restaurant).

5. **Cloudflare Pages & Supabase Prototype Architecture**:
   - Fully hostable on **Cloudflare Pages** (SPA build in `dist/` with `_redirects` SPA fallback rule and `wrangler.toml`).
   - Backed by **Supabase** (PostgreSQL schema in `supabase/schema.sql` with Realtime publication support).
   - Zero-friction demo fallback: Includes local persistent state store with pre-seeded Indonesian cafe menu items so it runs immediately out-of-the-box!

---

## 📂 Project Structure

```
ArPOS/
├── apps/
│   └── cashier/                 # Svelte 5 + Vite + Tailwind CSS POS App (Cloudflare Pages ready)
│       ├── public/_redirects    # Cloudflare Pages SPA rewrite rule
│       ├── wrangler.toml        # Cloudflare Pages deployment configuration
│       └── src/
│           ├── components/pos/  # ProductGrid, CartPanel, VariantModal, PaymentModal, ReceiptModal
│           ├── components/kds/  # KitchenView (Live Ticket Queue)
│           ├── components/shift/# ShiftManagement (Cash Drawer Reconciliation)
│           └── components/modules/ # ModuleRegistryView (Entitlement Engine)
├── packages/
│   ├── shared-types/            # Multi-tenant domain models, enums & module definitions
│   ├── utilities/               # Shift reconciliation math & module dependency engine
│   └── supabase-client/         # Supabase client wrapper & persistent demo store
├── supabase/
│   └── schema.sql               # Full PostgreSQL multi-tenant schema with Realtime setup
└── package.json                 # Monorepo workspaces
```

---

## 🛠️ Getting Started

### 1. Run Locally
```bash
# Run the Cashier POS development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Build for Production / Cloudflare Pages
```bash
npm run build --workspace=@arpos/cashier
```
The output will be generated in `apps/cashier/dist/`.

---

## ☁️ Deployment to Cloudflare Pages

### Option A: Via Cloudflare Dashboard (Recommended)
1. Push this repository to GitHub or GitLab.
2. In the [Cloudflare Dashboard](https://dash.cloudflare.com/), go to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages**.
3. Select your repository and configure build settings:
   - **Framework preset**: `None` or `Vite`
   - **Build command**: `npm run build --workspace=@arpos/cashier`
   - **Build output directory**: `apps/cashier/dist`
   - **Root directory**: `/`
4. Click **Save and Deploy**. Cloudflare Pages will serve your POS with edge caching and SSL!

### Option B: Via Wrangler CLI
```bash
npx wrangler pages deploy apps/cashier/dist --project-name arpos-cashier
```

---

## 🗄️ Setting Up Live Supabase (Optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of [`supabase/schema.sql`](file:///d:/Arsya_no_Shigoto/myProject/Web/Fullstack/ArPOS/supabase/schema.sql) and click **RUN**.
4. In your Cloudflare Pages environment variables (or inside the ArPOS web interface via the **Cloud icon** in the top navigation bar), enter:
   - `VITE_SUPABASE_URL` = `https://<your-project-id>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>`
