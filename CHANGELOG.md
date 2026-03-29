# Changelog — My Home Haven

All notable changes to this project are documented here.
Versions follow a `v[major].[minor].[patch]` convention.

---

## v2.3.0 — 2026-03-29

### New Features
- **Wishlist Tab** (⭐) — Add items you want to try or buy, with priority levels (High / Medium / Low), estimated price, store, and notes. Tap "✓ Got it" to instantly promote an item to your inventory.
- **Expiry Calendar** (📅) — Dedicated view grouping all items with expiry dates into four buckets: Already Expired, This Week, This Month, and Later. Shows days remaining/elapsed at a glance.

### Improvements to Existing Features

#### 🛒 Shopping List
- **Running total** displayed in the header when any items have prices set (e.g. "≈ $42.50")
- **Group by Store** toggle button appears when at least one item has a store set — switches list from category grouping to store grouping, with per-store subtotals
- Store column added to the CSV/Excel export

#### 📊 Dashboard
- New **Est. Shopping** stat card showing the estimated cost to restock all low stock items (appears only when price data is available)

#### 📦 Item Modal
- New **Store 🏪** field in "More options" — used to group the shopping list by store and to indicate where to buy each item

#### 📍 Locations Page
- Location cards are now **clickable** — tap any card to instantly filter the Inventory view to only items stored in that location
- "Tap to filter →" hint appears on cards with items

#### 🔍 Inventory Search
- Search now also matches the **store** field
- **Quick filter chips** below the search bar: ⚠️ Low Stock and 📅 Expiring Soon — toggle on/off to narrow results
- **Location filter chip** shown when inventory is filtered by a location — click ✕ to clear

#### 📷 Barcode Scanner
- Added **UPC Item DB** as a fallback API when Open Food Facts doesn't have the product (covers more household, cleaning, and personal care products)

#### 📥/📤 CSV
- New **Export** button in sidebar exports your full inventory to CSV (all fields: name, category, store, qty, unit, price, expiry date, location, notes)

### Bug Fixes
- Deleting a location now updates the UI **immediately** (optimistic update) instead of waiting for the realtime event
- Adding a location now shows immediately with a temporary placeholder (optimistic update)
- `useAuth`: added a **6-second hard timeout** so the spinner never hangs forever if Supabase is slow or offline

---

## ⚠️ Required SQL Migration

Run the following in your **Supabase SQL Editor** (Project → SQL Editor → New query):

```sql
-- 1. Add store field to items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS store text;

-- 2. Wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  notes           text,
  category_id     uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  priority        text DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  estimated_price numeric(10,2),
  store           text,
  link            text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wishlist"
  ON public.wishlist
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## v2.2.0 — 2026-03-28

### Features Added
- **Locations page** as dedicated navigation tab (sidebar + mobile tab bar)
- Location cards show item count badge and photo
- Inline add form with back-camera photo capture
- Delete with confirm dialog; items get untagged automatically

### Bug Fixes
- Spinner timeout: `useAuth` now resolves after 6 s maximum

---

## v2.1.0 — 2026-03-27

### Features Added
- **Dark mode** toggle (🌙 / ☀️) persisted in localStorage
- **Barcode scanner** using `@zxing/browser` + Open Food Facts API
- **Expiry date** tracking with red/amber badges on item cards
- **Price** field per item; estimated inventory value on dashboard
- **Recurring restock reminders** (recur_days) shown on dashboard
- **Item history** log (DB trigger) with collapsible viewer in modal
- **Duplicate item** action (📋 button in modal)
- **Bulk CSV import** with preview and progress bar
- **Share links** (read-only public URL via Supabase RPC)
- **Shopping mode** with per-item checkboxes and "Done Shopping" batch-update
- **Dashboard** with stat cards, category breakdown bar chart, recently updated list
- Browser **push notifications** for daily low-stock alerts

### Infrastructure
- SQL migration: `expiry_date`, `price`, `recur_days` columns on items
- `item_history` table with DB trigger `log_qty_change`
- `share_tokens` table + `get_shared_items` SECURITY DEFINER RPC
- Supabase realtime subscriptions for items, categories, locations

---

## v2.0.0 — 2026-03-26

### Major Refactor
- Migrated to **React 18 + Vite 5 + Tailwind 3**
- Custom color palette: blush, lavender, mint, peach
- Font: **Plus Jakarta Sans** (body) + **Pacifico** (brand title)
- PWA manifest + install banner
- Mobile-first card grid with desktop sidebar

---

## v1.0.0 — Initial Release

- Basic item CRUD
- Categories
- Quantity tracking with restock threshold
- Supabase PostgreSQL backend with Row Level Security
- Admin / viewer roles
