import type { UserRole } from '~~/shared/constants/roles'

/**
 * Role-gated pages should call definePageMeta({ middleware: ['auth', 'role'], roles: [...] })
 * via a custom meta key. This middleware reads route.meta.roles.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { user, loggedIn } = useUserSession()
  if (!loggedIn.value) {
    return navigateTo('/login')
  }

  const allowed = to.meta.roles as UserRole[] | undefined
  if (!allowed || allowed.length === 0) return

  const role = user.value?.role as UserRole | undefined
  if (!role || !allowed.includes(role)) {
    return navigateTo('/account')
  }
})
