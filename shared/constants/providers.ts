export const SERVICE_CATEGORY_SLUGS = [
  'pet-sitting',
  'dog-walking',
  'pet-boarding',
  'grooming',
  'pet-taxi',
  'veterinary',
  'training',
  'home-pet-care',
] as const

export type ServiceCategorySlug = (typeof SERVICE_CATEGORY_SLUGS)[number]

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategorySlug, string> = {
  'pet-sitting': 'نگهداری در منزل',
  'dog-walking': 'پیاده‌روی سگ',
  'pet-boarding': 'پانسیون',
  'grooming': 'آرایش و بهداشت',
  'pet-taxi': 'پت تاکسی',
  'veterinary': 'دامپزشکی',
  'training': 'آموزش',
  'home-pet-care': 'مراقبت در خانه',
}

export const PRICING_TYPES = ['HOURLY', 'DAILY', 'FIXED', 'PER_VISIT', 'CUSTOM'] as const
export type PricingType = (typeof PRICING_TYPES)[number]

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  HOURLY: 'ساعتی',
  DAILY: 'روزانه',
  FIXED: 'قیمت ثابت',
  PER_VISIT: 'هر مراجعه',
  CUSTOM: 'توافقی',
}

export const MAX_GALLERY_IMAGES = 8
