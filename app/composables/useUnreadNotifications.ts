/**
 * Shared unread-notification counter for header / navigation badges.
 * Refreshes on route change while the user is logged in; silent on failure.
 */
export function useUnreadNotifications() {
  const count = useState<number>('unread-notifications', () => 0)
  const { loggedIn } = useUserSession()
  let inflight: Promise<void> | null = null

  async function refresh() {
    if (!loggedIn.value) {
      count.value = 0
      return
    }
    if (inflight) return inflight
    inflight = $fetch<{ data: { count: number } }>('/api/notifications/unread-count')
      .then((res) => {
        count.value = res.data.count
      })
      .catch(() => {})
      .finally(() => {
        inflight = null
      })
    return inflight
  }

  function markAllRead() {
    count.value = 0
  }

  function decrement() {
    count.value = Math.max(0, count.value - 1)
  }

  return { count, refresh, markAllRead, decrement }
}
