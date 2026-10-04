export const REVIEW_SCORE_MIN = 1
export const REVIEW_SCORE_MAX = 5

export const REVIEW_DIMENSIONS = ['overall', 'communication', 'quality', 'punctuality', 'care'] as const
export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number]

export const REVIEW_DIMENSION_LABELS: Record<ReviewDimension, string> = {
  overall: 'کل تجربه',
  communication: 'ارتباط',
  quality: 'کیفیت خدمت',
  punctuality: 'وقت‌شناسی',
  care: 'مراقبت از حیوان',
}
