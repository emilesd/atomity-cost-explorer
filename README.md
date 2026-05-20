# Atomity Cloud Cost Explorer

An interactive, scroll-triggered cloud infrastructure cost visualization built for the Atomity Frontend Engineering Challenge.

**Live Demo:** [https://atomity-cost-explorer.vercel.app](https://atomity-cost-explorer.vercel.app)

---

## Feature Choice: Option A — Cluster Drill-Down

I chose the **hierarchical cost explorer** (0:30–0:40 in the video) because it presents a rich interaction design challenge: progressive disclosure through a **Cluster → Namespace → Pod** hierarchy with animated transitions and data tables.

Rather than pixel-copying the reference, I interpreted the concept as an interactive drill-down experience where:

- Users see proportional cost bars at each level
- Clicking a bar drills into its children with animated transitions
- A breadcrumb trail lets users navigate back up
- A metrics table updates dynamically with animated counters
- The entire section is scroll-triggered

---

## Animation Approach

- **Scroll-triggered entrance:** The section uses Framer Motion's `useInView` with a threshold offset to trigger a spring-based entrance animation
- **Staggered bar reveal:** Bars enter with a staggered delay (`index * 0.08s`) using spring physics for natural easing
- **Bar growth animation:** Each bar grows from `scaleY: 0` to `scaleY: 1` with `transformOrigin: bottom`, creating a "data materializing" effect
- **Drill-down transitions:** `AnimatePresence` with `mode="wait"` ensures smooth exit/enter transitions between hierarchy levels
- **Animated counters:** Dollar values count up from 0 using Framer Motion's `animate()` utility
- **Breadcrumb morphing:** Navigation items enter/exit with spring-based x-axis transitions
- **Hover feedback:** Interactive bars scale slightly with shadow on hover, with tap feedback
- **Reduced motion:** `window.matchMedia('prefers-reduced-motion')` is respected — animations skip to final state when enabled. A global CSS rule also disables all CSS transitions/animations

---

## Token & Style Architecture

### Design Tokens

CSS custom properties defined in `:root` serve as the single source of truth:

```css
:root {
  --color-bg-primary: #ffffff;
  --color-accent-mint: #86efac;
  --color-text-primary: #111827;
  /* ... */
}
```

A TypeScript `tokens` object mirrors these for type-safe access in components:

```ts
export const tokens = {
  colors: {
    bgPrimary: "var(--color-bg-primary)",
    accentMint: "var(--color-accent-mint)",
  },
} as const;
```

### Dark Mode

A `[data-theme="dark"]` selector overrides the same CSS variables, enabling theme switching without changing any component code. Theme preference persists via `localStorage`.

### Tailwind v4 Integration

The `@theme inline` directive maps CSS variables to Tailwind utility classes (`bg-background`, `text-foreground`, `bg-mint`, etc.), so components use Tailwind classes that automatically respond to theme changes.

### Modern CSS Features Used

| Feature | Where | Why |
|---------|-------|-----|
| `clamp()` | Typography (headings, labels) | Fluid sizing without breakpoints |
| `@container` queries | `CostBar` component | Cards adapt layout based on their own width, not viewport |
| `color-mix()` | Efficiency badges | Dynamic green-to-red gradient based on percentage value |
| `:has()` selector | `.cost-card` | Parent highlights when child is focused or hovered |
| CSS nesting | `globals.css` | Organized selector grouping without preprocessors |
| Logical properties | `inline-size`, `block-size`, `margin-inline` | Writing-direction-agnostic sizing |

---

## Data Fetching & Caching

### API Integration

Data is fetched from [DummyJSON Products API](https://dummyjson.com/products) and transformed through a pipeline:

1. **Fetch** — `fetchProducts()` retrieves 100 products with field selection
2. **Transform** — `transformToClusterData()` groups products into a 3-level hierarchy:
   - Categories → **Clusters** (top 4 by product count)
   - Product chunks → **Namespaces** (4 per cluster)
   - Sub-chunks → **Pods** (up to 4 per namespace)
3. **Scale** — Costs are normalized to target totals ($6,800 / $5,500 / $4,600 / $2,500) for realistic-looking data

### Caching Strategy

**TanStack Query** manages caching with:

- `staleTime: 5 minutes` — data stays fresh for 5 minutes
- `gcTime: 30 minutes` — unused data kept in memory for 30 minutes
- `refetchOnWindowFocus: false` — no unnecessary refetches
- Instant display on revisit from cache

### State Management

- **Loading:** Animated skeleton with pulsing bars and table rows
- **Error:** Alert with error message and retry button
- **Success:** Full chart and table with animated entrance

---

## Libraries Used

| Library | Version | Why |
|---------|---------|-----|
| **Next.js 16** | 16.2.6 | App Router, server components, optimized production builds |
| **Framer Motion** | 12.x | Spring physics, `AnimatePresence`, `useInView`, `animate()` |
| **TanStack Query** | 5.x | Declarative data fetching with built-in caching |
| **Tailwind CSS** | 4.x | Utility-first CSS with `@theme` integration |
| **Geist** | (via next/font) | Clean sans-serif + monospace for data display |

No pre-built UI component libraries were used. Every component (cards, badges, bars, breadcrumbs, tables, toggles) is hand-built.

---

## Project Structure

```
src/
  app/
    globals.css         — Design tokens, modern CSS, theme variables
    layout.tsx          — Root layout with QueryProvider
    page.tsx            — Main page with hero + CostExplorer
  tokens/
    index.ts            — TypeScript design token constants
  types/
    index.ts            — CostNode, DrillLevel, cost category types
  lib/
    api.ts              — DummyJSON fetch function
    transform.ts        — Product → Cluster hierarchy transformer
  hooks/
    useClusterData.ts   — TanStack Query hook with caching
  providers/
    QueryProvider.tsx    — React Query client provider
  components/
    CostExplorer.tsx    — Main orchestrator (state, drill-down logic)
    CostBarChart.tsx    — Animated bar chart container
    CostBar.tsx         — Individual proportional bar with hover/click
    MetricsTable.tsx    — Data table with animated rows
    Breadcrumb.tsx      — Navigation breadcrumb with morphing animation
    AnimatedCounter.tsx — Counting number animation
    ThemeToggle.tsx     — Dark/light mode toggle
    LoadingState.tsx    — Skeleton loading UI
    ErrorState.tsx      — Error display with retry
```

---

## Tradeoffs & Decisions

- **Data normalization over raw data:** API product prices vary wildly, so I scale totals to realistic cloud-cost ranges. This sacrifices "real" data accuracy but makes the visualization meaningful.
- **Chunk-based namespaces:** Instead of grouping by product brand (which gives uneven distribution), I chunk products into fixed groups to guarantee 4 namespaces per cluster.
- **CSS variables over Tailwind config:** The challenge explicitly asks for a token architecture. CSS custom properties give runtime theming (dark mode) while Tailwind's `@theme` gives utility class integration — both approaches work together.
- **Spring physics over cubic-bezier:** Spring-based easing feels more natural for UI transitions and demonstrates animation craftsmanship.
- **AnimatePresence mode="wait":** Ensures clean exit → enter transitions, avoiding visual overlap between drill-down levels.

---

## What I Would Improve With More Time

- **Shared layout animation:** Use Framer Motion's `layoutId` to morph the clicked bar into the next level's chart container for a seamless visual connection
- **Mini sparkline in table rows:** Show a small cost trend line for each row to add depth
- **Keyboard navigation:** Full arrow key support for navigating between bars and drill levels
- **URL-based navigation:** Encode the drill path in the URL for shareable deep links
- **Server-side rendering:** Use Next.js server components with `fetch` caching for initial data load, eliminating the client-side loading state on first paint
- **End-to-end tests:** Playwright tests for drill-down flow, breadcrumb navigation, and dark mode toggle

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

```bash
npx vercel
```

Or connect the GitHub repo to Vercel for automatic deployments.
