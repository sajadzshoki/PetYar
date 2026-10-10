import type { UserRole } from '../shared/constants/roles'

declare module '#app' {
  interface PageMeta {
    roles?: UserRole[]
    /** Set to `false` on full-screen flows (e.g. chat) to hide the mobile bottom navigation. */
    bottomNav?: boolean
  }
}

export {}
