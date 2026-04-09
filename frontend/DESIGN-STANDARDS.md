# Widgetis Frontend — Design Standards

> Source of truth: Pencil design file (`frontend/design.pen`, node `I13RR`).
> Rule: **never change the design — always change the code to match it.**

---

## 1. Colors (7 semantic + 6 neutral)

### Semantic Colors

| Token              | Hex       | CSS Variable  | Role                                              |
|--------------------|-----------|---------------|----------------------------------------------------|
| Primary Blue       | `#3B82F6` | `--blue`      | CTA, Pro plan, navigation, links, active elements  |
| Success Green      | `#10B981` | `--green`     | Basic plan, enabled, success, confirmation          |
| Accent Purple      | `#A855F7` | `--purple`    | Max plan, hero accent, premium elements             |
| Telegram Blue      | `#229ED9` | `--telegram`  | Only for Telegram links and support buttons         |
| Urgency Orange     | `#F97316` | `--orange`    | Timers, urgency, cancellation, warnings             |
| Danger Red         | `#EF4444` | `--red`       | Refunds, critical errors, irreversible actions      |
| Warning Yellow     | `#FBBF24` | `--yellow`    | Awaiting payment, paused, pending states            |

### Neutral Palette

| Token      | Hex       | CSS Variable       | Role            |
|------------|-----------|---------------------|-----------------|
| Background | `#0A0A0A` | `--bg-page`         | Page background |
| Cards      | `#141414` | `--bg-card`         | Card surfaces   |
| Inputs     | `#1A1A1A` | `--bg-input`        | Input fields    |
| Title      | `#F0F0F0` | `--text-primary`    | Primary text    |
| Secondary  | `#888888` | `--text-secondary`  | Secondary text  |
| Muted      | `#555555` | `--text-muted`      | Hints, disabled |

### Derived (opacity-based)

Each semantic color has variants: `--{color}-dim` (bg), `--{color}-glow` (hover), `--{color}-border`, `--{color}-ring`.
See `src/index.css` for exact values.

### Stars (Rating)

- Active: `#F5B400` — **NOT** `#fbbf24`
- Inactive: `#FFFFFF20`
- Implementation: `<Star fill="currentColor" stroke="none" color="#F5B400" />` from lucide-react

### Brand Messengers

| Brand    | Hex       |
|----------|-----------|
| Telegram | `#26A5E4` |
| Viber    | `#7360F2` |
| WhatsApp | `#25D366` |

---

## 2. Typography

**Font: Inter only.** No other fonts. No Outfit, no system fallbacks for display.

```
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Scale

| Level                | Size       | Weight      | Color            | Use                           |
|----------------------|------------|-------------|------------------|-------------------------------|
| H1 — Hero            | 28–52px    | 900 Black   | `--text-primary` | Landing hero headings         |
| H2 — Section         | 22–24px    | 800 Extra   | `--text-primary` | Section headings              |
| H3 — Card/Screen     | 15–18px    | 700 Bold    | `--text-primary` | Screen titles, card headings  |
| Body                 | 13–14px    | 400–600     | `--text-primary` | Main text, descriptions       |
| Small / Label        | 11–12px    | 600–700     | `--text-secondary` | Labels, badges, navigation  |
| Eyebrow / Overline   | 10px       | 700 + CAPS  | `--blue`         | Section labels (LS 1.5px)     |
| Stat / Number        | 20–28px    | 800–900     | `--blue`         | Counters, statistics          |

### Rules
- Weight scale: 400 (body), 600 (label), 700 (bold), 800 (heading), 900 (hero)
- Line height: 1.6 (body default)
- Language: only Ukrainian, address "Ви" capitalized

---

## 3. Icons

- **UI icons**: only `lucide-react`. No emoji. No other icon libraries.
- **Brand icons** (Telegram, Viber, WhatsApp): inline SVG with brand colors.
- **Widget icons**: mapped via `WidgetIcon.tsx` — each widget slug has a Lucide icon + color.

---

## 4. Plans — Single Source of Truth

Plans MUST be defined in ONE place (`src/data/plans.ts`) and imported everywhere.

| Plan  | Color     | CSS Variable | Price      | Yearly     |
|-------|-----------|--------------|------------|------------|
| Basic | `#10B981` | `--green`    | 799 ₴/міс | 7 990 ₴/рік |
| Pro   | `#3B82F6` | `--blue`     | 1 599 ₴/міс | 15 990 ₴/рік |
| Max   | `#A855F7` | `--purple`   | 2 899 ₴/міс | 28 990 ₴/рік |

Each plan has: `id`, `name`, `color`, `icon`, `monthlyPrice`, `yearlyPrice`, `features[]`.
**Never hardcode plan data in components. Always import from the single source.**

---

## 5. Layout — Global Structure

### All pages MUST have:
1. **Header** — sticky (`position: fixed`, `z-index: 100`), same component everywhere (marketing + cabinet)
2. **Footer** — on every page:
   - **Marketing pages**: full footer (brand, nav columns, contacts, legal links)
   - **Cabinet pages**: simplified footer (copyright + key links only)
3. **BackButton** — reusable `<BackButton />` component:
   - Always positioned top-left
   - Never overlaps text or content
   - Uses `<ArrowLeft />` from lucide-react
   - Navigates to explicit route (not `history.back()`)

### Header behavior
- Scroll: background becomes `rgba(14,14,14,0.85)` + `blur(16px)` after 8px scroll
- Contains: logo, nav links, CTA button, hamburger menu (mobile)
- Auth-aware: shows "Cabinet" link if logged in

### Border radius
- Cards: `8–14px`
- Pills / avatars: `999px`

---

## 6. Contacts & Social Links — From Backend

**Source**: `GET /api/v1/settings` (public, no auth required)

**Response fields**:
```json
{
  "phone": "+380 96 149 47 47",
  "email": "hello@widgetis.com",
  "business_hours": "Mon-Fri 9:00-20:00",
  "socials": {
    "instagram": "https://instagram.com/widgetis",
    "telegram": "https://t.me/widgetis",
    "facebook": ""
  },
  "messengers": {
    "telegram": "https://t.me/widgetis_support",
    "viber": "",
    "whatsapp": ""
  },
  "stats": {
    "stores_count": 120,
    "widgets_deployed": 530
  }
}
```

### Frontend rules:
- Fetch on app init, cache in React context / zustand store
- Cache TTL: 5 minutes (re-fetch on stale)
- **Never hardcode** phone, email, social links in components
- Empty string = hide that link (don't render)
- Admin manages all values via Filament panel

---

## 7. Widget Icon & Color Mapping

Each widget has a slug → icon + color mapping in `WidgetIcon.tsx`.
When adding a new widget, add its mapping there.

Current mappings (16 widgets):

| Slug           | Icon (Lucide)  | Color     |
|----------------|----------------|-----------|
| megaphone      | Megaphone      | `#7C3AED` |
| package        | Package        | `#059669` |
| cart           | ShoppingCart   | `#EA580C` |
| snowflake      | Snowflake      | `#38BDF8` |
| truck          | Truck          | `#16A34A` |
| eye            | Eye            | `#EC4899` |
| coins          | Coins          | `#F59E0B` |
| gift           | Gift           | `#F43F5E` |
| star           | Star           | `#FBBF24` |
| hourglass      | Hourglass      | `#8B5CF6` |
| camera         | Camera         | `#6366F1` |
| bell           | Bell           | `#14B8A6` |
| wheel          | Disc3          | `#F97316` |
| puzzle         | Puzzle         | `#3B82F6` |
| bar-chart      | BarChart3      | `#22C55E` |
| wrench         | Wrench         | `#6B7280` |

---

## 8. Component Reuse Rules

1. **Never duplicate data** — plans, widgets, contacts must have ONE source
2. **Wrap repeating UI blocks** in components — pricing cards, widget cards, stat counters
3. **Shared components** live in `src/components/` — imported where needed
4. **Page-specific components** live in `src/pages/<page>/components/`
5. **Changed in one place = changed everywhere** — no copy-paste of blocks

---

## 9. Admin Panel Layout — Mandatory Structure

The admin panel has a **fixed layout** that MUST be used on every admin screen without exception.
Source of truth: Pencil nodes `HTE7v` (Dashboard) and `X4vIO` (sub-pages).

---

### Header — two modes (sticky, always visible)

**Common rules for both modes:**
- `position: fixed`, `top: 0`, `width: 100%`, `z-index: 100`
- **Sticky — always follows the user on scroll, never disappears**
- Height: `60px`; background: `#0E0E0E`; padding: `0 20px`
- Bottom border: `1px solid rgba(255,255,255,0.04)`
- Layout: `display: flex; align-items: center; justify-content: space-between`

#### Mode 1 — Dashboard (main section, no back navigation)

```
[ burger menu btn ]   [ Title + Subtitle stack ]   [ Avatar ]
```

- **Left** — burger menu button: `36×36px`, `border-radius: 8px`, bg `rgba(255,255,255,0.03)`, Lucide `<Menu />` icon `18px` color `#AAAAAA`
- **Center** — vertical stack:
  - Title: `15px`, weight `700`, color `#F0F0F0`
  - Subtitle: `11px`, weight `400`, color `#555555`
- **Right** — avatar circle: `36×36px`, `border-radius: 999px`, bg `rgba(59,130,246,0.13)`, border `1px solid rgba(59,130,246,0.25)`, initials text `12px` weight `700` color `#3B82F6`

#### Mode 2 — Sub-page (detail / nested screen, has back navigation)

```
[ ← back btn ]   [ Page Title ]   [ action btn OR nothing ]
```

- **Left** — back button: `36×36px`, `border-radius: 8px`, bg `rgba(255,255,255,0.03)`, Lucide `<ArrowLeft />` icon `18px` color `#AAAAAA`
  - Navigation: use `useNavigate()` from React Router v6, call `navigate(-1)` to go back in history
- **Center** — page title: `16px`, weight `700`, color `#F0F0F0`
- **Right** — contextual action button (optional):
  - If the page has an action (e.g. export, download, add): `36×36px`, `border-radius: 10px`, bg `rgba(59,130,246,0.13)`, Lucide icon `17px` color `#3B82F6`
  - If no action needed: **render nothing** (empty `<div />` of equal size to keep title centered)

> When to use each mode: Dashboard tab → Mode 1. Any page reached by tapping a list item, a link, or drilling into a detail → Mode 2.

---

### Bottom Tab Navigation (always visible)

- `position: fixed`, `bottom: 0`, `width: 100%`, `z-index: 100`
- Always visible on every admin screen — never hidden or removed
- Height: `64px`; background: `#0E0E0E`; top border: `1px solid rgba(255,255,255,0.04)`
- Layout: `display: flex; justify-content: space-around; align-items: center; padding: 0 4px`
- Each tab: icon `20px` (Lucide) + label `9px` weight `600`, stacked vertically, gap `3px`
- **Active tab**: icon + label color `#3B82F6` (blue), weight `600`
- **Inactive tab**: icon + label color `#555555`, weight `500`

Tab items (from design):
| # | Icon (Lucide) | Label |
|---|---------------|-------|
| 1 | `LayoutDashboard` | Дашборд |
| 2 | `Receipt` | Замовлення |
| 3 | `Users` | Юзери |
| 4 | `Globe` | Сайти |
| 5 | `Banknote` | (icon only) |

---

### Content area

- `padding-top`: `60px` (= header height) so content is not hidden under sticky header
- `padding-bottom`: `64px` (= bottom nav height) + `32px` extra breathing room = `96px`
- Background: `#0A0A0A`

---

### Rule: no exceptions

Every admin screen — dashboard, orders, sites, users, payments, settings, any future screen — MUST use this exact header + bottom nav structure. There is no admin screen without both of these elements.

---

## 10. CSS Conventions

- All design tokens as CSS custom properties in `src/index.css`
- BEM naming: `.block__element--modifier`
- No inline styles except dynamic values (colors from widget mapping)
- No `!important` unless overriding third-party
- Responsive: mobile-first, breakpoints via media queries
- Transitions: use `--transition-fast` (0.15s), `--transition-normal` (0.25s)
