export const PET_TYPES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'OTHER'] as const
export type PetType = (typeof PET_TYPES)[number]

export const PET_GENDERS = ['MALE', 'FEMALE', 'UNKNOWN'] as const
export type PetGender = (typeof PET_GENDERS)[number]

export const PET_TYPE_LABELS: Record<PetType, string> = {
  DOG: 'سگ',
  CAT: 'گربه',
  BIRD: 'پرنده',
  RABBIT: 'خرگوش',
  RODENT: 'جونده',
  OTHER: 'سایر',
}

export const PET_GENDER_LABELS: Record<PetGender, string> = {
  MALE: 'نر',
  FEMALE: 'ماده',
  UNKNOWN: 'نامشخص',
}

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
