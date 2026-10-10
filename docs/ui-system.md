# UI system

Identity: warm, trustworthy, premium, photography-friendly. RTL (`lang=fa`, `dir=rtl`). Mobile-first.

## Tokens (`app/assets/css/main.css`)

- Terracotta / forest / ink / canvas / paper
- Typeface: Vazirmatn
- Primary UI color is terracotta, not a generic SaaS purple

## Patterns

- Lists and forms, not metric-card dashboards
- `AppState` for loading / empty / error
- Provider workspace: `layouts/provider.vue` + `ProviderNav`
- Admin: `layouts/admin.vue` — dense tables/lists, same palette
- Avoid glass, gradients, fake badges, invented ratings

## Accessibility

- Semantic headings and native form submit
- File inputs remain real `<input type="file">`
- Images use empty or descriptive `alt`
- Sticky header; nav overflow-x on small screens
