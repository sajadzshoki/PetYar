export const SEARCH_SORTS = ['newest', 'name', 'price_asc', 'price_desc', 'experience', 'distance'] as const
export type SearchSort = (typeof SEARCH_SORTS)[number]

export const SEARCH_VIEWS = ['providers', 'services'] as const
export type SearchView = (typeof SEARCH_VIEWS)[number]

export const SEARCH_SORT_LABELS: Record<SearchSort, string> = {
  newest: 'جدیدترین',
  name: 'نام',
  price_asc: 'ارزان‌تر',
  price_desc: 'گران‌تر',
  experience: 'سابقه بیشتر',
  distance: 'نزدیک‌تر',
}

export const DEFAULT_PAGE_SIZE = 12
export const MAX_PAGE_SIZE = 24
export const DEFAULT_NEAR_RADIUS_KM = 15
