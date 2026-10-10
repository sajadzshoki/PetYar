# UI system

Identity: warm, trustworthy, calm. Cream backgrounds, espresso text, forest-green primary, a restrained terracotta accent. RTL (`lang=fa`, `dir=rtl`), mobile-first, works as an installed PWA.

No purple gradients, neon, glow, glassmorphism, blobs, or stock photography. Real data or honest empty states; nothing simulated.

## Tokens (`app/assets/css/main.css`)

Everything lives in one `@theme static` block plus a `:root` block that maps Nuxt UI's semantic variables onto it. Use the generated utilities; do not hard-code hex values in components.

| Group | Tokens | Utilities |
| --- | --- | --- |
| Palette | `forest-50…950` (primary, 600 = `#426a38`), `terracotta-50…950` (accent, 500 = `#cf6327`), `ink-50…950` (text/neutral, 900 = `#2b2420`) | `bg-forest-50`, `text-terracotta-600`, `ring-ink-200` … |
| Surfaces | `canvas` (`#f8f4ee` page), `canvas-deep` (`#f0e9df` inset), `paper` (`#fffdf9` cards) | `bg-canvas`, `bg-canvas-deep`, `bg-paper` |
| Semantic text | `--ui-text-dimmed/muted/toned/default/highlighted` → ink 400/500/600/800/900 | `text-dimmed`, `text-muted`, `text-toned`, `text-default`, `text-highlighted` |
| Semantic bg/border | `--ui-bg*`, `--ui-border*` | `bg-default`, `bg-muted`, `bg-elevated`, `border-default`, `border-muted`, `ring-default` |
| Layout heights | `--spacing-header` 56px, `--spacing-header-lg` 64px, `--spacing-bottom-nav` 64px, `--spacing-touch` 44px | `h-header`, `lg:h-header-lg`, `h-bottom-nav`, `min-h-touch` |
| Widths | `--container-page` 1152px, `--container-content` 672px, `--container-narrow` 448px | `max-w-page`, `max-w-content`, `max-w-narrow` |
| Radius | `--ui-radius: 0.375rem` scales all Nuxt UI radii (sm 6 · md 9 · lg 12 · xl 18 · 2xl 24) | `rounded-md`, `rounded-xl` … |
| Shadows | `--shadow-card`, `--shadow-raised`, `--shadow-nav` | `shadow-card`, `shadow-raised`, `shadow-nav` |
| Motion | `--duration-fast/base/slow` (120/180/260ms), `--ease-app` | page transition `.page-*`; all disabled under `prefers-reduced-motion` |
| Safe areas | `--safe-top`, `--safe-bottom` from `env(safe-area-inset-*)` | `pt-safe`, `pb-safe`, `pb-nav` |

Custom utilities:

- `num` — `direction:ltr; unicode-bidi:isolate; tabular-nums`. Wrap **inline** numbers, times, phone numbers, coordinates. Do not put it on block elements (it flips text alignment); wrap a `<span class="num">` inside instead.
- `ltr` — isolate an LTR token (email, UUID, URL) inside RTL text.
- `surface` — paper card with ring + card shadow (the default `UCard` look without the component).
- `pressable` — subtle press feedback for tappable cards/rows.
- `scrollbar-none` — horizontal chip rows.
- `.skeleton` — pulsing placeholder block.

Nuxt UI theme (`app/app.config.ts`): `primary=forest`, `secondary=terracotta`, `neutral=ink`, `success=forest`, `warning=amber`, `error=red`. Buttons/inputs default to size `lg` (44px touch target); cards, modals and dropdowns are pre-styled to the paper surface.

## Dark mode

Nuxt UI’s color mode (`@nuxtjs/color-mode`) is the only theme switch. `nuxt.config.ts` sets `preference` and `fallback` to `light`, stores the choice in the `nuxt-color-mode` cookie (separate from the auth session), and an inline head script applies the class before paint.

`ThemeToggle` (sun/moon, Lucide) lives in `AppHeader`, the auth layout, the account page, and provider settings. It sets `colorMode.preference` to `light` or `dark`. There is no system-preference mode and no extra bottom-nav item.

Dark values are a `.dark` block in `main.css`. Light tokens are not rewritten. The dark palette is warm charcoal (`canvas` `#161311`, `paper` `#3a332c`) with off-white text. `forest-50` and `terracotta-50` become dark tints; `forest-100/200/800` stay literal because the trust band and chat timestamps use them as fixed brand colors. In dark mode `--ui-primary` / `--ui-secondary` move to shade 300 so text and fills both clear 4.5:1, and `--ui-text-inverted` becomes espresso so solid buttons keep dark type on those lighter fills.

A few components add `dark:` utilities where one class is a light-mode wash and another is a fixed brand color (stars, error text, the white trust-band button). Logos and photos are not filtered.

## Typography

- Vazirmatn is self-hosted: `public/fonts/Vazirmatn-Variable.woff2` (wght 100–900, SIL OFL — see `public/fonts/Vazirmatn-OFL.txt`), declared with a single `@font-face` in `main.css`, preloaded in `nuxt.config.ts`, and `@nuxt/fonts` is told `provider: 'none'` so nothing is fetched from Google.
- Body: 16px / 1.75 line-height, weight 400. Headings use weight 700 with tighter leading; `h1` 24–30px depending on breakpoint via `PageHeader`.
- Numbers come from `app/utils/format.ts` (`formatNumber`, `formatToman`, `formatDate`, `formatDateTime`, `formatTime`, `formatDayShort`, `formatCalendarDay`, `formatRelative`, `formatRating`, `formatDistance`, `initialOf`) — always `fa-IR`, Tehran time.
- Mixed text: keep Persian words outside `num` spans; `۱۰:۰۰ تا ۱۲:۰۰` should be `<span class="num">۱۰:۰۰</span> تا <span class="num">۱۲:۰۰</span>`.

## Navigation

Role-aware, defined once in `app/utils/navigation.ts`:

| Audience | Mobile (`< md`) | Desktop |
| --- | --- | --- |
| Guest | `AppBottomNav` with `GUEST_TABS` (خانه / جستجو / ورود) | Top links in `AppHeader` + ورود / ثبت‌نام |
| Customer | `AppBottomNav` with `CUSTOMER_TABS` (خانه / جستجو / رزروها / پیام‌ها / پروفایل) | Top links + account `UDropdownMenu` |
| Provider | `ProviderNav` → bottom tabs `PROVIDER_TABS` (کارتابل / رزروها / خدمات / بیشتر); «بیشتر» opens a modal grid of `PROVIDER_MORE` | Tab strip under the header |
| Admin | `AdminNav variant="strip"` (horizontal scroll) | `AdminNav variant="sidebar"` |

Rules:

- Active state uses `isNavActive(path, item)` (exact or prefix match, plus `also` aliases) so deep links and refreshes highlight correctly.
- The bottom bar is `fixed`, `pb-safe`, and pages get `pb-nav` so content never hides behind it. Opt out per page with `definePageMeta({ bottomNav: false })` (used by the chat screen and the payment return screen). Auth pages use `layouts/auth.vue`, which has no nav.
- Unread notification count comes from `useUnreadNotifications()` and shows as a badge on the bell and the پیام‌ها tab.

## Shared components (`app/components`)

| Component | Use |
| --- | --- |
| `PageHeader` | Title, eyebrow, description, optional back link, `#meta` and `#actions` slots. `compact` for detail screens. |
| `AppSection` | Titled paper surface for grouping form fields / detail blocks; `flush` for edge-to-edge lists. |
| `AppState` | Loading / empty / error state with icon, description, optional `retry`. |
| `SkeletonList` | Placeholder rows while a list loads. |
| `InlineMessage` | Inline `UAlert` for form errors / warnings. |
| `StatusBadge` + `*_STATUS_META` | Status pills with icon + color (never color-only). |
| `ListRow` | Tappable row with leading/trailing slots and chevron. |
| `MediaThumb` | Image with initial/icon fallback; `rounded` md/lg/xl/full. |
| `RatingSummary`, `ScoreInput` | Read-only rating line; accessible 1–5 radio-group picker. |
| `ProviderCard`, `BookingRow` | List items for search results and booking lists (owner & provider perspectives). |
| `PetForm`, `ProviderServiceForm` | Shared create/edit forms. |
| `AppLogo` | Brand mark (`public/brand/petyar-mark*.png`) with optional wordmark. |

## Patterns

- Lists and forms over dashboards; the provider dashboard shows counts of real queued work and sums of stored payments only.
- Destructive or irreversible actions (cancel, reject, delete, suspend, hide) confirm in a `UModal` with a reason field when the API needs one.
- Filters and secondary forms on mobile open as bottom sheets (`USlideover side="bottom"`).
- Payment states always reflect the server; an unconfigured gateway shows a warning, never a fake success.
- Date separators and relative times for chat and notifications; absolute dates for bookings and payments.

## Accessibility

- `:focus-visible` ring in forest on every interactive element; keyboard-operable chips, tabs (`role=tablist`), radiogroups and star inputs.
- Minimum 44px touch targets via `min-h-touch` and `size="lg"` defaults.
- Icon-only buttons carry `aria-label`; decorative icons are `aria-hidden`.
- Status is conveyed by icon + label + color.
- Live regions on the booking quote box and chat log; reduced-motion users get no transitions or skeleton pulse.
- Contrast, light (WCAG relative luminance): `ink-500` (`text-muted`) is 5.4:1 on `paper`, 5.0:1 on `canvas`, 4.6:1 on `canvas-deep`; `ink-800` body text is 11.7:1; `forest-600` buttons with white text are 6.3:1.
- Contrast, dark: muted text is 5.1:1 on `paper` and higher on `canvas`; body text is 9.3:1 on `paper`; primary sage (`forest-300`) is 6.1:1 as text on `paper` and 9.1:1 as a fill behind espresso type.

## Responsive checks

Verified with headless Chrome at 320 / 360 / 390 / 430 / 768 / 1024 / 1440 for every route: no horizontal overflow, bottom nav only below `md`, admin sidebar only at `lg+`.
