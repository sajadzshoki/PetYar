export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'فعال',
  SUSPENDED: 'مسدود',
  DEACTIVATED: 'غیرفعال',
}

export const VERIFICATION_STATUSES = [
  'UNVERIFIED',
  'PENDING',
  'NEEDS_CHANGES',
  'APPROVED',
  'REJECTED',
] as const
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  UNVERIFIED: 'احراز نشده',
  PENDING: 'در انتظار بررسی',
  NEEDS_CHANGES: 'نیاز به اصلاح',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
}

export const VERIFICATION_DOCUMENT_KINDS = [
  'NATIONAL_ID',
  'SELFIE',
  'BUSINESS_LICENSE',
  'OTHER',
] as const
export type VerificationDocumentKind = (typeof VERIFICATION_DOCUMENT_KINDS)[number]

export const VERIFICATION_DOCUMENT_LABELS: Record<VerificationDocumentKind, string> = {
  NATIONAL_ID: 'کارت ملی',
  SELFIE: 'تصویر چهره با مدرک',
  BUSINESS_LICENSE: 'مجوز کسب',
  OTHER: 'سایر',
}

export const REPORT_TARGET_TYPES = ['USER', 'PROVIDER', 'BOOKING', 'REVIEW'] as const
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number]

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  USER: 'کاربر',
  PROVIDER: 'ارائه‌دهنده',
  BOOKING: 'رزرو',
  REVIEW: 'نظر',
}

export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'SCAM',
  'INAPPROPRIATE',
  'SAFETY',
  'OTHER',
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: 'هرزنامه',
  HARASSMENT: 'آزار',
  SCAM: 'کلاهبرداری',
  INAPPROPRIATE: 'محتوای نامناسب',
  SAFETY: 'ایمنی حیوان',
  OTHER: 'سایر',
}

export const REPORT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'باز',
  IN_REVIEW: 'در حال بررسی',
  RESOLVED: 'رسیدگی‌شده',
  DISMISSED: 'رد شده',
}

export const DISPUTE_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number]

export const DISPUTE_STATUS_LABELS: Record<DisputeStatus, string> = {
  OPEN: 'باز',
  IN_REVIEW: 'در حال بررسی',
  RESOLVED: 'حل‌شده',
  DISMISSED: 'بسته بدون اقدام',
}

export const DISPUTE_RESOLUTIONS = [
  'UPHOLD',
  'CANCEL_BOOKING',
  'COMPLETE_BOOKING',
  'REFUND_RECOMMENDED',
] as const
export type DisputeResolution = (typeof DISPUTE_RESOLUTIONS)[number]

export const DISPUTE_RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  UPHOLD: 'وضعیت قبلی رزرو برقرار شود',
  CANCEL_BOOKING: 'لغو رزرو',
  COMPLETE_BOOKING: 'اتمام خدمت',
  REFUND_RECOMMENDED: 'پیشنهاد بازپرداخت (بدون اجرای خودکار)',
}
