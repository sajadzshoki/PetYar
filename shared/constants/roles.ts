export const USER_ROLES = ['OWNER', 'PROVIDER', 'ADMIN'] as const

export type UserRole = (typeof USER_ROLES)[number]

export const DEFAULT_USER_ROLE: UserRole = 'OWNER'
