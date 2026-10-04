export function apiErrorMessage(error: unknown, fallback: string) {
  const err = error as {
    data?: {
      error?: { message?: string }
      data?: { error?: { message?: string } }
      statusMessage?: string
    }
  }
  return err.data?.error?.message || err.data?.data?.error?.message || err.data?.statusMessage || fallback
}
