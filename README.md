# Atomity Cloud Cost Explorer

An interactive cloud infrastructure cost visualization built for the Atomity Frontend Engineering Challenge.

---

## Feature Choice: Option A — Cluster Drill-Down

I chose the **hierarchical cost explorer** (0:30–0:40 in the video) because it presents a rich interaction design challenge: progressive disclosure through a **Cluster → Namespace → Pod** hierarchy with animated transitions and data tables.

Rather than pixel-copying the reference, I interpreted the concept as an interactive drill-down experience where:

- Users see proportional cost bars at each level
- Clicking a bar drills into its children with a phased animation
- A back chip lets users navigate up
- A metrics table updates dynamically with animated counters
- The entire section is scroll-triggered

---

## Animation Approach

The **drill-down morph** is the centerpiece — a 4-phase state machine that makes each transition feel deliberate:

### Phase 1 — Pulse (340ms)
Click a cluster bar → it zooms to 1.08× with a darker green flash as immediate feedback.

### Phase 2 — Split + Hold (600ms)
The solid bar fades out while stacked child segments fade in with visible 6px gaps between them, held long enough for the user to read "this cluster is made of 4 namespaces."

### Phase 3 — Diagonal Travel (1.8s)
Each segment slides diagonally from its stack position down to its own column's baseline. A landing burst (halo glow + baseline splash + bar flash) fires at the exact moment each bar arrives.

### Phase 4 — Grow (1.6s)
Bars expand from their slice height to full natural height with a sustained dark-to-light color settle. The growth is a separate phase so the user sees "travel" and "grow" as distinct beats.

Other animations:

- **Scroll-triggered entrance:** `useInView` with margin offset triggers a spring entrance
- **Staggered bar reveal:** Initial bars enter with a staggered delay (`index * 0.06s`)
- **Animated counters:** Dollar values count up using Framer Motion's `animate()` utility, preserving previous value across drill-downs
- **Hover feedback:** Interactive bars scale slightly on hover; sibling bars dim via CSS `:has()` (no JS)
- **Grid-line pulse:** Dashed gridlines breathe and turn mint during transitions
- **Reduced motion:** `window.matchMedia('prefers-reduced-motion')` is respected — animations skip to final state. A global CSS rule also disables all CSS transitions/animations.

### Click Reliability

Drill-down clicks are protected by:
- A ref-based `drillLock` that prevents double-fire from rapid clicks (setState batching means phase may still read "idle" on second click)
- `pointerEvents: "none"` on disabled bars so Framer Motion's gesture recognizers cannot swallow events
- Early return for leaf nodes (pods have no children)

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

### Dark Mode

A `[data-theme="dark"]` selector overrides the same CSS variables, enabling theme switching without changing any component code. Theme preference persists via `localStorage`.

### Tailwind v4 Integration

The `@theme inline` directive maps CSS variables to Tailwind utility classes (`bg-background`, `text-foreground`, `bg-mint`, etc.), so components use Tailwind classes that automatically respond to theme changes.

### Modern CSS Features Used

| Feature | Where | Why |
|---------|-------|-----|
| `clamp()` | Typography (headings, labels) | Fluid sizing without breakpoints |
| `@container` queries | `CostBar` component | Bars adapt label/value size based on their own width |
| `color-mix()` | Efficiency badges | Dynamic green-to-red gradient based on percentage value |
| `:has()` selector | `.cost-bar-grid` | Hovering one bar dims siblings — pure CSS, no JS, GPU-accelerated |
| CSS nesting | `globals.css` | Organized selector grouping without preprocessors |
| Logical properties | `inline-size`, `block-size` | Writing-direction-agnostic sizing |

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

---

## Libraries Used

| Library | Version | Why |
|---------|---------|-----|
| **Next.js 16** | 16.2.6 | App Router, server components, optimized production builds |
| **Framer Motion** | 12.x | Spring physics, `AnimatePresence`, `useInView`, `animate()` |
| **TanStack Query** | 5.x | Declarative data fetching with built-in caching |
| **Tailwind CSS** | 4.x | Utility-first CSS with `@theme` integration |
| **Geist** | (via next/font) | Clean sans-serif + monospace for data display |

No pre-built UI component libraries were used.

---

## Project Structure

```
src/
  app/
    globals.css         — Design tokens, :has() sibling-dim, container queries
    layout.tsx          — Root layout with QueryProvider
    page.tsx            — Hero section + CostExplorer + footer
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
    CostExplorer.tsx    — State machine (phase timing, back chip, scrollIntoView)
    CostBarChart.tsx    — Grid container (gridline pulse, enterFrom math, :has() dim)
    CostBar.tsx         — Individual bar (click, pulse, split, travel, grow, landing burst)
    MetricsTable.tsx    — Data table with animated rows
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
- **Phase state machine over layoutId:** Framer Motion's `layoutId` proved too hard to control for the specific "split → travel → grow" sequence. An explicit 4-phase timer with per-property transitions gives deterministic, predictable motion.
- **Ref-based drill lock over state guard:** React's setState batching can leave `phase === "idle"` visible to a second rapid click. A synchronous ref flip prevents the race.

---

## What I Would Improve With More Time

- **Keyboard navigation:** Full arrow key support for navigating between bars and drill levels
- **URL-based navigation:** Encode the drill path in the URL for shareable deep links
- **Server-side rendering:** Use Next.js server components with `fetch` caching for initial data load
- **End-to-end tests:** Playwright tests for drill-down flow, back navigation, and dark mode toggle

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
